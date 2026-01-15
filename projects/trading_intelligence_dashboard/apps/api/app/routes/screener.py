from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.deps import get_db

router = APIRouter(prefix="/screener", tags=["screener"])

@router.get("")
def run_screener(
    symbols: str | None = Query(default=None, description="Comma-separated symbols. If omitted, uses all symbols in DB."),
    min_price: float | None = None,
    max_price: float | None = None,
    min_volume: int | None = None,
    min_pct_change: float | None = None,   # e.g. 2.0 means +2%
    max_pct_change: float | None = None,   # e.g. 10.0 means +10%
    limit: int = 50,
    db: Session = Depends(get_db),
):
    # Base query:
    # - Pick latest row per symbol (rn=1)
    # - Also pull previous close (rn=2) for % change
    # - Compute pct_change = (close - prev_close) / prev_close * 100
    base_sql = """
    WITH ranked AS (
      SELECT
        symbol,
        day,
        open,
        high,
        low,
        close,
        volume,
        ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY day DESC) AS rn,
        LAG(close) OVER (PARTITION BY symbol ORDER BY day DESC) AS prev_close
      FROM prices_daily
      {symbol_filter}
    ),
    latest AS (
      SELECT
        symbol,
        day,
        close,
        volume,
        prev_close,
        CASE
          WHEN prev_close IS NULL OR prev_close = 0 THEN NULL
          ELSE ((close - prev_close) / prev_close) * 100
        END AS pct_change
      FROM ranked
      WHERE rn = 1
    )
    SELECT symbol, day, close, volume, prev_close, pct_change
    FROM latest
    WHERE 1=1
      {min_price_filter}
      {max_price_filter}
      {min_volume_filter}
      {min_pct_filter}
      {max_pct_filter}
    ORDER BY
      CASE WHEN pct_change IS NULL THEN 1 ELSE 0 END,
      pct_change DESC NULLS LAST
    LIMIT :limit;
    """

    params = {"limit": limit}

    # Optional symbol list filter
    symbol_filter = ""
    if symbols:
      sym_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
      if sym_list:
        symbol_filter = "WHERE symbol = ANY(:symbols)"
        params["symbols"] = sym_list

    def add_filter(name: str, clause: str, value):
      if value is None:
        return ""
      params[name] = value
      return clause

    rendered = base_sql.format(
      symbol_filter=symbol_filter if symbol_filter else "",
      min_price_filter=add_filter("min_price", " AND close >= :min_price", min_price),
      max_price_filter=add_filter("max_price", " AND close <= :max_price", max_price),
      min_volume_filter=add_filter("min_volume", " AND volume >= :min_volume", min_volume),
      min_pct_filter=add_filter("min_pct_change", " AND pct_change >= :min_pct_change", min_pct_change),
      max_pct_filter=add_filter("max_pct_change", " AND pct_change <= :max_pct_change", max_pct_change),
    )

    rows = db.execute(text(rendered), params).mappings().all()

    return [
      {
        "symbol": r["symbol"],
        "day": r["day"].isoformat(),
        "close": float(r["close"]),
        "volume": int(r["volume"]),
        "prev_close": float(r["prev_close"]) if r["prev_close"] is not None else None,
        "pct_change": float(r["pct_change"]) if r["pct_change"] is not None else None,
      }
      for r in rows
    ]
