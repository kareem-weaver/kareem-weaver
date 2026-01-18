import json
import os
import time
import hashlib
from datetime import datetime, timezone
from jobs.ftc_rss import fetch_ftc_press_releases

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

NEWS_LIST_KEY = "news:items"
NEWS_SEEN_KEY = "news:seen"
MAX_ITEMS = 300


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


def ftc_rss_job():
    for it in reversed(items):
        push_news_item({
            "uid": it.uid,
            "source": it.source,
            "title": it.title,
            "url": it.url,
            "published_at": it.published_at,
            "symbols": it.symbols,
            "score": it.score,
            "tags": it.tags,
        })

    print(f"[worker] FTC RSS fetched={len(items)} pushed_new={pushed_count}")


def main():
    print(f"[worker] starting with REDIS_URL={REDIS_URL}")
    while True:
        try:
            ftc_rss_job()
        except Exception as e:
            print(f"[worker] error: {e}")
        time.sleep(30)


if __name__ == "__main__":
    main()
