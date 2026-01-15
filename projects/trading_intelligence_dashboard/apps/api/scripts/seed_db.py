from datetime import date, timedelta
import random

from app.db.session import SessionLocal, engine, Base
from app.db.models import PriceDaily

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    symbol = "AAPL"
    start = date.today() - timedelta(days=40)

    # Delete existing AAPL rows (safe for dev)
    db.query(PriceDaily).filter(PriceDaily.symbol == symbol).delete()
    db.commit()

    price = 180.0
    for i in range(30):
        d = start + timedelta(days=i)
        # skip weekends to keep it realistic
        if d.weekday() >= 5:
            continue

        daily_move = random.uniform(-2.0, 2.0)
        o = price
        c = max(1.0, price + daily_move)
        h = max(o, c) + random.uniform(0.0, 1.5)
        l = min(o, c) - random.uniform(0.0, 1.5)
        v = random.randint(30_000_000, 120_000_000)

        db.add(
            PriceDaily(
                symbol=symbol,
                day=d,
                open=round(o, 2),
                high=round(h, 2),
                low=round(l, 2),
                close=round(c, 2),
                volume=v,
            )
        )
        price = c

    db.commit()
    db.close()
    print("Seeded AAPL candles.")

if __name__ == "__main__":
    main()
