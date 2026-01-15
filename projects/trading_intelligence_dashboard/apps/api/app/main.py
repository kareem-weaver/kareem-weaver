from fastapi import FastAPI
from app.db.session import engine, Base
from app.db import models
from app.routes import tickers
from fastapi.middleware.cors import CORSMiddleware
from app.routes import tickers, screener

app = FastAPI(title="Trading Intelligence API")

app.include_router(tickers.router)
app.include_router(screener.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.include_router(tickers.router)

@app.get("/health")
def health():
    return {"status": "ok"}
