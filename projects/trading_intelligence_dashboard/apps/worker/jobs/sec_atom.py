# apps/worker/jobs/sec_atom.py
from __future__ import annotations

import hashlib
import os
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import List, Optional

import requests
# Latest filings Atom feed (same as “Latest Filings” page RSS link, output=atom)
# You can optionally set SEC_FORM_TYPE=8-K to filter.
SEC_ATOM_URL = os.getenv(
    "SEC_ATOM_URL",
    "https://www.sec.gov/cgi-bin/browse-edgar"
    "?action=getcurrent&CIK=&type=&company=&dateb=&owner=include&start=0&count=40&output=atom",
)

SEC_USER_AGENT = os.getenv(
    "SEC_USER_AGENT",
    # per SEC guidance: identify yourself + contact
    "TradingIntelligenceDashboard (jabbaweaver@example.com)",
)

@dataclass
class SecItem:
    uid: str
    source: str
    title: str
    url: str
    published_at: str
    symbols: List[str]
    score: float
    tags: List[str]

ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}


def _sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def fetch_sec_atom(count: int = 40, form_type: Optional[str] = None) -> List[SecItem]:
    """
    Pull the SEC 'Latest Filings' Atom feed.
    """
    params = None
    url = SEC_ATOM_URL

    # If you want to filter by type without changing the base URL:
    # The endpoint supports query params like type=8-K, count=40, output=atom.
    # (Those are present on the Latest Filings page.) :contentReference[oaicite:2]{index=2}
    if form_type:
        # Easiest: just tack &type=FORM if not already set
        if "type=" in url:
            # replace existing type=
            import re
            url = re.sub(r"type=[^&]*", f"type={form_type}", url)
        else:
            url += f"&type={form_type}"

    # replace count if needed
    if "count=" in url:
        import re
        url = re.sub(r"count=\d+", f"count={count}", url)
    else:
        url += f"&count={count}"

    headers = {
        "User-Agent": SEC_USER_AGENT,  # required by SEC guidance :contentReference[oaicite:3]{index=3}
        "Accept-Encoding": "gzip, deflate",
        "Accept": "application/atom+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()

    root = ET.fromstring(resp.text)
    out: List[SecItem] = []

    for entry in root.findall("atom:entry", ATOM_NS):
        title = (entry.findtext("atom:title", default="", namespaces=ATOM_NS) or "").strip()
        updated = (entry.findtext("atom:updated", default="", namespaces=ATOM_NS) or "").strip()

        # prefer rel="alternate" link, else first link
        link_url = ""
        links = entry.findall("atom:link", ATOM_NS)
        for lk in links:
            rel = (lk.attrib.get("rel") or "").lower()
            href = lk.attrib.get("href") or ""
            if rel == "alternate" and href:
                link_url = href
                break
        if not link_url and links:
            link_url = links[0].attrib.get("href") or ""

        if not link_url:
            # skip malformed entries
            continue

        uid = f"sec:{_sha1(link_url)}"

        out.append(
            SecItem(
                uid=uid,
                source="SEC",
                title=title,
                url=link_url,
                published_at=updated or "",
                symbols=[],   # later: map CIK→ticker, or parse title
                score=0.0,
                tags=[],
            )
        )

    return out


def sec_atom_job(push_news_item, count: int = 40, form_type: Optional[str] = None) -> None:
    items = fetch_sec_atom(count=count, form_type=form_type)
    pushed_count = 0

    # reverse so older entries push first, newest ends up “on top” in your feed
    for it in reversed(items):
        pushed = push_news_item(
            {
                "uid": it.uid,
                "source": it.source,
                "title": it.title,
                "url": it.url,
                "published_at": it.published_at,
                "symbols": it.symbols,
                "score": it.score,
                "tags": it.tags,
            }
        )
        if pushed:
            pushed_count += 1

    print(f"[worker] SEC Atom fetched={len(items)} pushed_new={pushed_count}")
