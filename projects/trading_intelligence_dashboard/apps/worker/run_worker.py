import json
import os
import time
import hashlib
from datetime import datetime, timezone

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

NEWS_LIST_KEY = "news:items"
NEWS_SEEN_KEY = "news:seen"
MAX_ITEMS = 1000


def make_uid(source: str, title: str, url: str, published_at: str) -> str:
    raw = f"{source}|{title}|{url}|{published_at}".encode("utf-8")
    return f"{source.lower()}:{hashlib.sha1(raw).hexdigest()}"


def push_news_item(item: dict) -> bool:
    uid = item["uid"]
    if r.sismember(NEWS_SEEN_KEY, uid):
        return False

    pipe = r.pipeline()
    pipe.sadd(NEWS_SEEN_KEY, uid)
    pipe.lpush(NEWS_LIST_KEY, json.dumps(item))
    pipe.ltrim(NEWS_LIST_KEY, 0, MAX_ITEMS - 1)
    pipe.execute()
    return True


def demo_job():
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    source = "DummyFeed"
    title = f"Demo headline @ {now}"
    url = "https://example.com"
    published_at = now
    symbols = ["AAPL", "MSFT"]

    uid = make_uid(source, title, url, published_at)

    item = {
        "uid": uid,
        "source": source,
        "title": title,
        "url": url,
        "published_at": published_at,
        "symbols": symbols,
        "score": 0.0,
        "tags": [],
    }

    pushed = push_news_item(item)
    print(f"[worker] pushed={pushed} uid={uid}")


def main():
    print(f"[worker] starting with REDIS_URL={REDIS_URL}")
    while True:
        try:
            demo_job()
        except Exception as e:
            print(f"[worker] error: {e}")
        time.sleep(3)


if __name__ == "__main__":
    main()
