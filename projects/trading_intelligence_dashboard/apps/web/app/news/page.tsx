"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchNews } from "@/lib/api";

type ApiNewsItem = {
  title: string;
  source?: string;
  url?: string;
  published_at?: string;
  symbols?: string[];
};

type UiNewsItem = {
  id: string;
  source: string;
  title: string;
  url?: string | null;
  tickers: string[];
  score: number;
  created_at: string;
};

export default function NewsPage() {
  const [items, setItems] = useState<UiNewsItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [items]);

  async function load() {
    try {
      setStatus((s) => (s === "idle" ? "loading" : s));

      // fetchNews returns an array from the backend
      const data = (await fetchNews({ limit: 50 })) as any[];

      const mapped: NewsItem[] = (data ?? []).map((n: any, idx: number) => ({
        id: String(n.uid ?? `${n.published_at ?? ""}-${idx}`),
        source: n.source ?? "Unknown",
        title: n.title,
        url: n.url ?? null,
        tickers: Array.isArray(n.symbols) ? n.symbols : [],
        score: typeof n.score === "number" ? n.score : Number(n.score ?? 0),
        created_at: n.published_at ?? new Date().toISOString(),
      }));

      setItems(mapped);
      setStatus("ok");
      setErrorMsg("");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to load news");
    }
  }


  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">News</h1>
        <div className="text-sm opacity-70">
          {status === "loading" && "Loading..."}
          {status === "ok" && `Live (polling) • ${new Date().toLocaleTimeString()}`}
          {status === "error" && "Error"}
        </div>
      </div>

      {status === "error" && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium">Couldn’t load news</div>
          <div className="opacity-70">{errorMsg}</div>
        </div>
      )}

      <div className="space-y-3">
        {sortedItems.map((n) => (
          <div key={n.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-wide opacity-70">
                {n.source} • {new Date(n.created_at).toLocaleTimeString()}
              </div>
              <div className="text-xs opacity-70">score: {n.score.toFixed(2)}</div>
            </div>

            <div className="mt-2 text-base">
              {n.url ? (
                <a href={n.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {n.title}
                </a>
              ) : (
                <span>{n.title}</span>
              )}
            </div>

            {n.tickers?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {n.tickers.map((t) => (
                  <span key={t} className="text-xs rounded-full border px-2 py-1">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {status !== "error" && sortedItems.length === 0 && (
          <div className="rounded-md border p-3 text-sm opacity-70">No news yet.</div>
        )}
      </div>
    </div>
  );
}
