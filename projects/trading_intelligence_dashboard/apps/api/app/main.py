from fastapi import FastAPI
from app.db.session import engine, Base
from app.db import models
from app.routes import tickers

app = FastAPI(title="Trading Intelligence API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.include_router(tickers.router)

@app.get("/health")
def health():
    return {"status": "ok"}
