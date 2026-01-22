import json
import os
from typing import List, Optional
from fastapi import APIRouter
import redis
from datetime import datetime, timezone

router = APIRouter(prefix="/news", tags=["news"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
NEWS_LIST_KEY = os.getenv("NEWS_LIST_KEY", "news:items")

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def _parse_iso(s: str) -> Optional[datetime]:
    try:
        # supports "Z"
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s).astimezone(timezone.utc)
    except Exception:
        return None
    
@router.get("")
def get_news(
    limit: int = 25, 
    minutes: Optional[int] = None, 
    since: Optional[str] = None,
    source: Optional[str] = None
):
    
    # scan deeper than limit so filters still work when SEC dominates
    scan_limit = max(2000, limit * 200)

    raw = r.lrange("news:items", 0, scan_limit - 1)
    items = [json.loads(x) for x in raw]

    # optional source filter
    if source and source.lower() != "all":
        src = source.upper()
        items = [it for it in items if (it.get("source") or "").upper() == src]

    # time filter
    cutoff = None

    if minutes is not None:
        cutoff_ts = datetime.now(timezone.utc).timestamp() - (minutes * 60)
    elif since:
        dt = _parse_iso(since)
        if dt:
            cutoff_ts = dt.timestamp()

    if cutoff is not None:
        def ts(it) -> float:
            dt = _parse_iso(it.get("published_at", "") or "")
            return dt.timestamp() if dt else 0.0
        
        items = [it for it in items if ts(it) >= cutoff_ts]

    # sort newest-first by published_at so results are stable
    def sort_key(it) -> float:
        dt = _parse_iso(it.get("published_at", "") or "")
        return dt.timestamp() if dt else 0.0

    items.sort(key=sort_key, reverse=True)
    return items[:limit]