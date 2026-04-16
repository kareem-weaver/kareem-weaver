const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type NewsApiItem = {
  uid?: string;
  source?: string;
  title: string;
  url?: string;
  published_at?: string;
  symbols?: string[];
  score?: number;
  tags?: string[];
};

export type ScreenerRow = {
  symbol: string;
  day: string;
  close: number | null;
  volume: number | null;
  prev_close: number | null;
  pct_change: number | null;
  avg_volume: number | null;
  rvol: number | null;
};

export type Candle = {
  symbol: string;
  day: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

async function readApiError(res: Response, fallback: string) {
  try {
    const payload = (await res.json()) as { detail?: string };
    if (payload?.detail) {
      return payload.detail;
    }
  } catch {
    // ignore JSON parse failures and fall back to status text
  }

  return `${fallback} ${res.status}`;
}

export async function fetchNews(params?: {
  limit?: number;
  source?: string;
  minutes?: number;
  since?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.source) qs.set("source", params.source);
  if (params?.minutes != null) qs.set("minutes", String(params.minutes));
  if (params?.since) qs.set("since", params.since);

  const url = `${API_BASE}/news${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`News API error ${res.status}`);
  return (await res.json()) as NewsApiItem[];
}

export async function fetchScreener(params?: {
  symbols?: string;
  min_price?: number;
  max_price?: number;
  min_volume?: number;
  min_pct_change?: number;
  max_pct_change?: number;
  rvol_days?: number;
  min_rvol?: number;
  max_rvol?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  });

  const url = `${API_BASE}/screener${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await readApiError(res, "Screener API error"));
  return (await res.json()) as ScreenerRow[];
}

export async function fetchCandles(symbol: string, limit = 90) {
  const qs = new URLSearchParams({ limit: String(limit) });
  const url = `${API_BASE}/tickers/${encodeURIComponent(symbol)}/candles?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await readApiError(res, "Ticker candles API error"));
  return (await res.json()) as Candle[];
}
