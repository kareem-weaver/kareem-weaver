from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.deps import get_db
from app.db.models import PriceDaily

router = APIRouter(prefix="/tickers", tags=["tickers"])

@router.get("/{symbol}/candles")
def get_candles(symbol: str, limit: int = 60, db: Session = Depends(get_db)):
    stmt = (
        select(PriceDaily)
        .where(PriceDaily.symbol == symbol.upper())
        .order_by(PriceDaily.day.desc())
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()

    # return ascending for charting
    rows = list(reversed(rows))

    return [
        {
            "symbol": r.symbol,
            "day": r.day.isoformat(),
            "open": r.open,
            "high": r.high,
            "low": r.low,
            "close": r.close,
            "volume": r.volume,
        }
        for r in rows
    ]
