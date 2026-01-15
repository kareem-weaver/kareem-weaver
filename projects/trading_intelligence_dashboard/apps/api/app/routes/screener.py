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

    min_pct_change: float | None = None,
    max_pct_change: float | None = None,

    # NEW: Relative volume filters
    rvol_days: int = 20,                 # N-day average volume baseline
    min_rvol: float | None = None,       # e.g. 1.5 means 50% above avg
    max_rvol: float | None = None,

    limit: int = 50,
    db: Session = Depends(get_db),
):
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
    ),
    vol_baseline AS (
      -- average volume over the next rvol_days rows (excluding rn=1)
      SELECT
        symbol,
        AVG(volume)::float AS avg_volume
      FROM ranked
      WHERE rn BETWEEN 2 AND (1 + :rvol_days)
      GROUP BY symbol
    )
    SELECT
      l.symbol,
      l.day,
      l.close,
      l.volume,
      l.prev_close,
      l.pct_change,
      vb.avg_volume,
      CASE
        WHEN vb.avg_volume IS NULL OR vb.avg_volume = 0 THEN NULL
        ELSE (l.volume::float / vb.avg_volume)
      END AS rvol
    FROM latest l
    LEFT JOIN vol_baseline vb
      ON vb.symbol = l.symbol
    WHERE 1=1
      {min_price_filter}
      {max_price_filter}
      {min_volume_filter}
      {min_pct_filter}
      {max_pct_filter}
      {min_rvol_filter}
      {max_rvol_filter}
    ORDER BY
      CASE
        WHEN (CASE WHEN vb.avg_volume IS NULL OR vb.avg_volume = 0 THEN NULL ELSE (l.volume::float / vb.avg_volume) END) IS NULL
        THEN 1 ELSE 0
      END,
      (CASE WHEN vb.avg_volume IS NULL OR vb.avg_volume = 0 THEN NULL ELSE (l.volume::float / vb.avg_volume) END) DESC NULLS LAST
    LIMIT :limit;
    """

    params = {"limit": limit, "rvol_days": rvol_days}

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
        min_price_filter=add_filter("min_price", " AND l.close >= :min_price", min_price),
        max_price_filter=add_filter("max_price", " AND l.close <= :max_price", max_price),
        min_volume_filter=add_filter("min_volume", " AND l.volume >= :min_volume", min_volume),
        min_pct_filter=add_filter("min_pct_change", " AND l.pct_change >= :min_pct_change", min_pct_change),
        max_pct_filter=add_filter("max_pct_change", " AND l.pct_change <= :max_pct_change", max_pct_change),
        min_rvol_filter=add_filter("min_rvol", " AND (CASE WHEN vb.avg_volume IS NULL OR vb.avg_volume = 0 THEN NULL ELSE (l.volume::float / vb.avg_volume) END) >= :min_rvol", min_rvol),
        max_rvol_filter=add_filter("max_rvol", " AND (CASE WHEN vb.avg_volume IS NULL OR vb.avg_volume = 0 THEN NULL ELSE (l.volume::float / vb.avg_volume) END) <= :max_rvol", max_rvol),
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
            "avg_volume": float(r["avg_volume"]) if r["avg_volume"] is not None else None,
            "rvol": float(r["rvol"]) if r["rvol"] is not None else None,
        }
        for r in rows
    ]
