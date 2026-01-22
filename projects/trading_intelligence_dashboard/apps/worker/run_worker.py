import json
import os
import time
import hashlib
from datetime import datetime, timezone
from jobs.ftc_rss import fetch_ftc_press_releases
from pipelines.ticker_universe import load_ticker_universe
from pipelines.ticker_extract import extract_tickers
from jobs.sec_atom import sec_atom_job

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

NEWS_LIST_KEY = "news:items"
NEWS_SEEN_KEY = "news:seen"
MAX_ITEMS = 300

TICKER_UNIVERSE = load_ticker_universe()


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


def ftc_rss_job(items):
    pushed_count = 0

    for it in reversed(items):
        symbols = extract_tickers(it.title, TICKER_UNIVERSE)  # <-- ADD THIS LINE

        pushed = push_news_item({
            "uid": it.uid,
            "source": it.source,
            "title": it.title,
            "url": it.url,
            "published_at": it.published_at,
            "symbols": symbols,      # <-- USE THIS, not it.symbols
            "score": it.score,
            "tags": it.tags,
        })

        if pushed:
            pushed_count += 1 

    print(f"[worker] FTC RSS fetched={len(items)} pushed_new={pushed_count}")



def main():
    TICKER_UNIVERSE = load_ticker_universe()
    print(f"[worker] ticker universe loaded: {len(TICKER_UNIVERSE)} symbols")

    print(f"[worker] starting with REDIS_URL={REDIS_URL}")
    while True:
        try:
            # FTC
            items = fetch_ftc_press_releases(limit=25)
            ftc_rss_job(items)

            # SEC
            sec_atom_job(push_news_item, count=40, form_type=os.getenv("SEC_FORM_TYPE"))

        except Exception as e:
            print(f"[worker] error: {e}")
        time.sleep(30)


if __name__ == "__main__":
    main()
