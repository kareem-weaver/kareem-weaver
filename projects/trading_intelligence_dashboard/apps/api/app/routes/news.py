import json
import os
from typing import List, Optional

from fastapi import APIRouter
import redis

router = APIRouter(prefix="/news", tags=["news"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
NEWS_LIST_KEY = "news:items"

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)


@router.get("")
def get_news(limit: int = 25, symbol: Optional[str] = None):
    # pull latest N (grab a bit extra if filtering by symbol)
    fetch_n = min(max(limit * 5, limit), 500) if symbol else limit
    raw_items: List[str] = r.lrange(NEWS_LIST_KEY, 0, max(fetch_n - 1, 0))

    items = []
    for s in raw_items:
        try:
            item = json.loads(s)
        except Exception:
            continue

        if symbol:
            syms = item.get("symbols") or []
            if symbol not in syms:
                continue

        items.append(item)
        if len(items) >= limit:
            break

    return items
