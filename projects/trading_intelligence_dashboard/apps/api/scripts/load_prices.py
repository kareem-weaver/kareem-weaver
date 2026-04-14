import argparse
import os
from typing import Iterable

import pandas as pd
import yfinance as yf
from sqlalchemy import create_engine, text

DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA", "META", "AMZN"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Load daily price history into prices_daily")
    parser.add_argument(
        "--symbols",
        type=str,
        default=None,
        help="Comma-separated ticker symbols, e.g. AAPL,MSFT,NVDA",
    )
    parser.add_argument(
        "--period",
        type=str,
        default="6mo",
        help="yfinance period, e.g. 1mo, 3mo, 6mo, 1y, 2y, max",
    )
    parser.add_argument(
        "--interval",
        type=str,
        default="1d",
        help="yfinance interval, e.g. 1d",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default=os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/trading"),
        help="Postgres connection string",
    )
    parser.add_argument(
        "--use-db-symbols",
        action="store_true",
        help="Load symbols already present in prices_daily",
    )
    parser.add_argument(
        "--use-ticker-universe",
        action="store_true",
        help="Load symbols from Nasdaq/otherlisted ticker universe cache files",
    )
    parser.add_argument(
        "--limit-symbols",
        type=int,
        default=None,
        help="Optional cap on number of symbols loaded",
    )
    return parser.parse_args()


def normalize_symbols(raw: str) -> list[str]:
    return [s.strip().upper() for s in raw.split(",") if s.strip()]


def ensure_table(engine) -> None:
    ddl = """
    CREATE TABLE IF NOT EXISTS prices_daily (
        symbol TEXT NOT NULL,
        day DATE NOT NULL,
        open DOUBLE PRECISION,
        high DOUBLE PRECISION,
        low DOUBLE PRECISION,
        close DOUBLE PRECISION,
        volume BIGINT,
        PRIMARY KEY (symbol, day)
    );
    """
    with engine.begin() as conn:
        conn.execute(text(ddl))


def get_db_symbols(engine) -> list[str]:
    sql = "SELECT DISTINCT symbol FROM prices_daily ORDER BY symbol"
    with engine.begin() as conn:
        rows = conn.execute(text(sql)).fetchall()
    return [r[0] for r in rows]


def parse_pipe_file(path: str, symbol_col: str) -> set[str]:
    tickers: set[str] = set()

    if not os.path.exists(path):
        return tickers

    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = [ln.strip() for ln in f.readlines() if ln.strip()]

    if not lines:
        return tickers

    header = lines[0].split("|")
    try:
        sym_idx = header.index(symbol_col)
    except ValueError:
        return tickers

    for ln in lines[1:]:
        if ln.startswith("File Creation Time"):
            break
        parts = ln.split("|")
        if len(parts) <= sym_idx:
            continue
        sym = parts[sym_idx].strip().upper()
        if sym:
            tickers.add(sym)

    return tickers


def get_ticker_universe_symbols() -> list[str]:
    """
    Reads the cached universe files created by your ticker-universe pipeline.
    Adjust paths if needed.
    """
    cache_dir_candidates = [
        "apps/worker/.cache/tickers",
        "/worker/.cache/tickers",
    ]

    nasdaq_path = None
    other_path = None

    for cache_dir in cache_dir_candidates:
        n = os.path.join(cache_dir, "nasdaqlisted.txt")
        o = os.path.join(cache_dir, "otherlisted.txt")
        if os.path.exists(n) and os.path.exists(o):
            nasdaq_path = n
            other_path = o
            break

    if not nasdaq_path or not other_path:
        print("[WARN] Could not find ticker universe cache files.")
        return []

    nasdaq = parse_pipe_file(nasdaq_path, "Symbol")
    other = parse_pipe_file(other_path, "ACT Symbol")

    symbols = sorted(nasdaq.union(other))

    # light cleanup: yfinance often struggles with some special formats
    cleaned = []
    for s in symbols:
        if "." in s or "$" in s or "/" in s or " " in s:
            continue
        if len(s) > 6:
            continue
        cleaned.append(s)

    return cleaned


def choose_symbols(args: argparse.Namespace, engine) -> list[str]:
    if args.symbols:
        symbols = normalize_symbols(args.symbols)
    elif args.use_db_symbols:
        symbols = get_db_symbols(engine)
    elif args.use_ticker_universe:
        symbols = get_ticker_universe_symbols()
    else:
        symbols = DEFAULT_SYMBOLS

    if args.limit_symbols is not None:
        symbols = symbols[: args.limit_symbols]

    return symbols


def download_symbol_history(symbol: str, period: str, interval: str) -> pd.DataFrame:
    df = yf.download(
        symbol,
        period=period,
        interval=interval,
        auto_adjust=False,
        progress=False,
        threads=False,
    )

    if df.empty:
        return df

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] for c in df.columns]

    df = df.reset_index()

    if "Date" in df.columns:
        df.rename(columns={"Date": "day"}, inplace=True)
    elif "Datetime" in df.columns:
        df.rename(columns={"Datetime": "day"}, inplace=True)
    else:
        raise ValueError(f"Unexpected date column layout for {symbol}: {df.columns.tolist()}")

    required_cols = ["Open", "High", "Low", "Close", "Volume"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns for {symbol}: {missing}")

    out = pd.DataFrame(
        {
            "symbol": symbol,
            "day": pd.to_datetime(df["day"]).dt.date,
            "open": pd.to_numeric(df["Open"], errors="coerce"),
            "high": pd.to_numeric(df["High"], errors="coerce"),
            "low": pd.to_numeric(df["Low"], errors="coerce"),
            "close": pd.to_numeric(df["Close"], errors="coerce"),
            "volume": pd.to_numeric(df["Volume"], errors="coerce").fillna(0).astype("int64"),
        }
    )

    out = out.dropna(subset=["day", "open", "high", "low", "close"])
    return out


def upsert_prices(engine, rows: Iterable[dict]) -> int:
    sql = """
    INSERT INTO prices_daily (symbol, day, open, high, low, close, volume)
    VALUES (:symbol, :day, :open, :high, :low, :close, :volume)
    ON CONFLICT (symbol, day)
    DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume
    """
    rows = list(rows)
    if not rows:
        return 0

    with engine.begin() as conn:
        conn.execute(text(sql), rows)
    return len(rows)


def main() -> None:
    args = parse_args()
    engine = create_engine(args.database_url, future=True)
    ensure_table(engine)

    symbols = choose_symbols(args, engine)
    if not symbols:
        raise SystemExit("No symbols selected.")

    print(f"Loading {len(symbols)} symbols")
    print(f"Period={args.period}, Interval={args.interval}")

    total_rows = 0

    for i, symbol in enumerate(symbols, start=1):
        try:
            df = download_symbol_history(symbol, args.period, args.interval)
            if df.empty:
                print(f"[{i}/{len(symbols)}] [WARN] No data for {symbol}")
                continue

            rows = df.to_dict(orient="records")
            inserted = upsert_prices(engine, rows)
            total_rows += inserted
            print(f"[{i}/{len(symbols)}] [OK] {symbol}: upserted {inserted} rows")
        except Exception as e:
            print(f"[{i}/{len(symbols)}] [ERROR] {symbol}: {e}")

    print(f"Done. Total upserted rows: {total_rows}")


if __name__ == "__main__":
    main()