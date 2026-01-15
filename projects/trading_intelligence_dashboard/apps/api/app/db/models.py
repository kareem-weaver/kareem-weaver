from datetime import date
from sqlalchemy import String, Date, Float, BigInteger
from sqlalchemy.orm import Mapped, mapped_column
from .session import Base

class PriceDaily(Base):
    __tablename__ = "prices_daily"

    symbol: Mapped[str] = mapped_column(String(12), primary_key=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True)

    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=False)
