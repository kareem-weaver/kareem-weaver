import os
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.deps import get_db
from app.db.models import PriceDaily
from scripts.load_prices import download_symbol_history, ensure_table, upsert_prices

router = APIRouter(prefix="/tickers", tags=["tickers"])
SYMBOL_PATTERN = re.compile(r"^[A-Z][A-Z0-9.\-]{0,9}$")
LOOKUP_PERIOD = os.getenv("TICKER_LOOKUP_PERIOD", "6mo")
LOOKUP_INTERVAL = os.getenv("TICKER_LOOKUP_INTERVAL", "1d")


def canonicalize_symbol(symbol: str) -> str:
    # yfinance expects dash-separated share-class symbols like BRK-B.
    return symbol.strip().upper().replace(".", "-")


def fetch_rows(db: Session, symbol: str, limit: int) -> list[PriceDaily]:
    stmt = (
        select(PriceDaily)
        .where(PriceDaily.symbol == symbol)
        .order_by(PriceDaily.day.desc())
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


def backfill_symbol_history(db: Session, symbol: str) -> bool:
    engine = db.get_bind()
    ensure_table(engine)

    df = download_symbol_history(symbol, LOOKUP_PERIOD, LOOKUP_INTERVAL)
    if df.empty:
        return False

    inserted = upsert_prices(engine, df.to_dict(orient="records"))
    if inserted == 0:
        return False

    db.expire_all()
    return True

@router.get("/{symbol}/candles")
def get_candles(
    symbol: str,
    limit: int = Query(default=60, ge=1, le=252),
    db: Session = Depends(get_db),
):
    normalized_symbol = canonicalize_symbol(symbol)
    if not SYMBOL_PATTERN.fullmatch(normalized_symbol):
        raise HTTPException(status_code=400, detail="Invalid ticker symbol.")

    rows = fetch_rows(db, normalized_symbol, limit)

    if not rows and not backfill_symbol_history(db, normalized_symbol):
        raise HTTPException(
            status_code=404,
            detail=f"No daily candle history found for {normalized_symbol}.",
        )

    if not rows:
        rows = fetch_rows(db, normalized_symbol, limit)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No daily candle history found for {normalized_symbol}.",
        )

    # return ascending for charting
    rows = list(reversed(rows))

    return [
        {
            "symbol": r.symbol,
            "day": r.day.isoformat(),
            "open": float(r.open),
            "high": float(r.high),
            "low": float(r.low),
            "close": float(r.close),
            "volume": int(r.volume),
        }
        for r in rows
    ]
