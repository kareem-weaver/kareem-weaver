from datetime import date, timedelta
import random

from app.db.session import SessionLocal, engine, Base
from app.db.models import PriceDaily

SYMBOLS = {
    "AAPL": 180.0,
    "MSFT": 410.0,
    "NVDA": 520.0,
    "TSLA": 250.0,
    "AMZN": 145.0,
    "META": 480.0,
    "GOOGL": 140.0,
}

DAYS = 40  # lookback window

def generate_candles(symbol: str, start_price: float):
    candles = []
    price = start_price
    start_day = date.today() - timedelta(days=DAYS)

    for i in range(DAYS):
        d = start_day + timedelta(days=i)

        # skip weekends
        if d.weekday() >= 5:
            continue

        daily_move = random.uniform(-0.03, 0.03) * price

        open_p = price
        close_p = max(1.0, price + daily_move)

        high_p = max(open_p, close_p) + random.uniform(0.0, 0.015) * price
        low_p = min(open_p, close_p) - random.uniform(0.0, 0.015) * price

        volume = random.randint(30_000_000, 120_000_000)

        candles.append(
            PriceDaily(
                symbol=symbol,
                day=d,
                open=round(open_p, 2),
                high=round(high_p, 2),
                low=round(low_p, 2),
                close=round(close_p, 2),
                volume=volume,
            )
        )

        price = close_p

    return candles


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing rows (dev-safe)
    db.query(PriceDaily).delete()
    db.commit()

    total = 0
    for symbol, start_price in SYMBOLS.items():
        rows = generate_candles(symbol, start_price)
        db.add_all(rows)
        total += len(rows)

    db.commit()
    db.close()

    print(f"Seeded {total} candles across {len(SYMBOLS)} symbols.")


if __name__ == "__main__":
    main()
