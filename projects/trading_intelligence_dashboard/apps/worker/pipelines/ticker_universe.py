import os
import time
import requests

NASDAQ_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"
OTHER_LISTED_URL  = "https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt"

CACHE_DIR = os.getenv("TICKER_CACHE_DIR", "/worker/.cache/tickers")
os.makedirs(CACHE_DIR, exist_ok=True)

def _download(url: str, filename: str, timeout_s: int = 20) -> str:
    path = os.path.join(CACHE_DIR, filename)
    headers = {"User-Agent": "TradingIntelligenceDashboard/0.1"}

    r = requests.get(url, headers=headers, timeout=timeout_s)
    r.raise_for_status()

    with open(path, "w", encoding="utf-8") as f:
        f.write(r.text)

    return path

def _read_cached(filename: str) -> str | None:
    path = os.path.join(CACHE_DIR, filename)
    if os.path.exists(path):
        return path
    return None

def _parse_pipe_file(path: str, symbol_col: str) -> set[str]:
    tickers: set[str] = set()
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = [ln.strip() for ln in f.readlines() if ln.strip()]

    # Header line is pipe-delimited
    header = lines[0].split("|")
    try:
        sym_idx = header.index(symbol_col)
    except ValueError:
        # Unexpected format
        return tickers

    for ln in lines[1:]:
        # Files end with a "File Creation Time" line that doesn't match the table
        if ln.startswith("File Creation Time"):
            break
        parts = ln.split("|")
        if len(parts) <= sym_idx:
            continue
        sym = parts[sym_idx].strip().upper()
        if not sym:
            continue
        tickers.add(sym)

    return tickers

def load_ticker_universe() -> set[str]:
    """
    Loads a fresh universe (download) if possible; falls back to cached files.
    Returns a set of ticker symbols.
    """
    try:
        nasdaq_path = _download(NASDAQ_LISTED_URL, "nasdaqlisted.txt")
        other_path  = _download(OTHER_LISTED_URL,  "otherlisted.txt")
    except Exception:
        nasdaq_path = _read_cached("nasdaqlisted.txt")
        other_path  = _read_cached("otherlisted.txt")
        if not nasdaq_path or not other_path:
            return set()

    # Nasdaq file headers differ slightly:
    # nasdaqlisted has "Symbol"
    # otherlisted has "ACT Symbol"
    nasdaq = _parse_pipe_file(nasdaq_path, "Symbol")
    other  = _parse_pipe_file(other_path, "ACT Symbol")

    # Basic cleanup: remove test issues if present as symbols (optional)
    return nasdaq.union(other)
