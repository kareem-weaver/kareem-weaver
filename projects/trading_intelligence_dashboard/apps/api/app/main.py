from fastapi import FastAPI
from app.db.session import engine, Base
from app.db import models
from fastapi.middleware.cors import CORSMiddleware
from app.routes import tickers, screener
from app.routes import news

app = FastAPI(title="Trading Intelligence API")

app.include_router(news.router)
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


@app.get("/health")
def health():
    return {"status": "ok"}
