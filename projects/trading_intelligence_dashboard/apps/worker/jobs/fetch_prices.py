import os

from scripts.load_prices import choose_symbols, load_prices
from sqlalchemy import create_engine


def refresh_prices(
    *,
    database_url: str | None = None,
    use_ticker_universe: bool = True,
    period: str = "6mo",
    interval: str = "1d",
    limit_symbols: int | None = None,
    batch_size: int = 25,
) -> tuple[int, list[str]]:
    database_url = database_url or os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL is required for price refreshes.")

    engine = create_engine(database_url, future=True)
    args = type(
        "Args",
        (),
        {
            "symbols": None,
            "use_db_symbols": not use_ticker_universe,
            "use_ticker_universe": use_ticker_universe,
            "limit_symbols": limit_symbols,
        },
    )()

    symbols = choose_symbols(args, engine)
    if not symbols:
        return 0, []

    return load_prices(
        database_url=database_url,
        symbols=symbols,
        period=period,
        interval=interval,
        batch_size=batch_size,
    )
