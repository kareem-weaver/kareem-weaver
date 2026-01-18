// apps/web/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type NewsItem = {
  id?: string | number;
  source?: string;
  title: string;
  url?: string;
  published_at?: string;
  symbol?: string;
  symbols?: string[];
};

export async function fetchNews(params?: { limit?: number; symbol?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.symbol) qs.set("symbol", params.symbol);

  // ✅ CHANGE THIS PATH if your backend uses something different
  const url = `${API_BASE}/news${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`News API error ${res.status}: ${text}`);
  }
  return (await res.json()) as NewsItem[];
}
