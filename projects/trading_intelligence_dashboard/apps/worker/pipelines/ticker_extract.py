import re

TOKEN_RE = re.compile(r"\b[A-Z]{1,5}\b")

BLOCKLIST = {
    "A", "I", "IT", "ON", "AN", "AM", "AT", "AS", "OR", "DO", "BE", "BY", "WE",
    "ARE", "ALL", "NOW", "NEW", "FTC"
}

def extract_tickers(title: str, universe: set[str]) -> list[str]:
    cands = TOKEN_RE.findall(title.upper())
    out = []
    seen = set()

    for tok in cands:
        if tok in BLOCKLIST:
            continue
        if tok in universe and tok not in seen:
            out.append(tok)
            seen.add(tok)

    return out
