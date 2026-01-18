import hashlib
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import List, Optional
import xml.etree.ElementTree as ET

import requests


DEFAULT_FTC_PRESS_RELEASE_FEED = "https://www.ftc.gov/feeds/press-release.xml"


@dataclass
class NormalizedNewsItem:
    uid: str
    source: str
    title: str
    url: str
    published_at: str
    symbols: List[str]
    score: float
    tags: List[str]


def _to_iso8601(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _make_uid(source: str, guid: Optional[str], url: str, published_at: str) -> str:
    # Prefer GUID if present; else hash stable fields.
    if guid:
        raw = f"{source}|guid|{guid}".encode("utf-8")
    else:
        raw = f"{source}|{url}|{published_at}".encode("utf-8")
    return f"{source.lower()}:{hashlib.sha1(raw).hexdigest()}"


def fetch_ftc_press_releases(limit: int = 25, timeout_s: int = 15) -> List[NormalizedNewsItem]:
    feed_url = os.getenv("FTC_PRESS_RELEASE_RSS", DEFAULT_FTC_PRESS_RELEASE_FEED)

    headers = {
        "User-Agent": "TradingIntelligenceDashboard/0.1 (+local dev; contact: none)"
    }
    resp = requests.get(feed_url, headers=headers, timeout=timeout_s)
    resp.raise_for_status()

    # Parse RSS XML
    root = ET.fromstring(resp.text)
    channel = root.find("channel")
    if channel is None:
        return []

    items_out: List[NormalizedNewsItem] = []

    for item in channel.findall("item")[:limit]:
        title = (item.findtext("title") or "").strip()
        url = (item.findtext("link") or "").strip()
        guid = (item.findtext("guid") or "").strip() or None

        pub_date_raw = (item.findtext("pubDate") or "").strip()
        if pub_date_raw:
            try:
                dt = parsedate_to_datetime(pub_date_raw)
                published_at = _to_iso8601(dt)
            except Exception:
                published_at = _to_iso8601(datetime.now(timezone.utc))
        else:
            published_at = _to_iso8601(datetime.now(timezone.utc))

        if not title or not url:
            continue

        uid = _make_uid("FTC", guid, url, published_at)

        items_out.append(
            NormalizedNewsItem(
                uid=uid,
                source="FTC",
                title=title,
                url=url,
                published_at=published_at,
                symbols=[],   # ticker extraction later
                score=0.0,    # scoring later
                tags=[],      # tagging later
            )
        )

    return items_out
