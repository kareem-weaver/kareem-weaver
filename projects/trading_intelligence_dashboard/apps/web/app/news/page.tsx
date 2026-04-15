"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchNews, NewsApiItem } from "@/lib/api";

type UiNewsItem = {
  id: string;
  source: string;
  title: string;
  url?: string | null;
  tickers: string[];
  score: number;
  created_at: string;
};

function mapApiToUi(data: NewsApiItem[]): UiNewsItem[] {
  return (data ?? []).map((n, idx) => ({
    id: String(n.uid ?? `${n.published_at ?? ""}-${idx}`),
    source: n.source ?? "Unknown",
    title: n.title,
    url: n.url ?? null,
    tickers: Array.isArray(n.symbols) ? n.symbols : [],
    score: typeof n.score === "number" ? n.score : Number(n.score ?? 0),
    created_at: n.published_at ?? new Date().toISOString(),
  }));
}

export default function NewsPage() {
  const [items, setItems] = useState<UiNewsItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<"live" | "history">("live");
  const [historyLimit, setHistoryLimit] = useState(50);

  const reqSeq = useRef(0);
  const modeRef = useRef<"live" | "history">("live");
  const liveSeenRef = useRef<Set<string>>(new Set());
  const liveSessionIdRef = useRef(0);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [items]
  );

  async function loadHistory() {
    const seq = ++reqSeq.current;
    try {
      setStatus((s) => (s === "idle" ? "loading" : s));
      const data = await fetchNews({ limit: historyLimit });
      if (seq !== reqSeq.current) return;
      if (modeRef.current !== "history") return;

      setItems(mapApiToUi(data));
      setStatus("ok");
      setErrorMsg("");
    } catch (e: any) {
      if (seq !== reqSeq.current) return;
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to fetch");
    }
  }

  async function startLiveSession() {
    reqSeq.current += 1;
    const sessionId = ++liveSessionIdRef.current;

    setItems([]);
    setStatus("loading");
    setErrorMsg("");

    try {
      const baseline = await fetchNews({ limit: 200 });
      if (sessionId !== liveSessionIdRef.current) return;
      if (modeRef.current !== "live") return;

      const baselineMapped = mapApiToUi(baseline);
      liveSeenRef.current = new Set(baselineMapped.map((x) => x.id));
      setStatus("ok");
    } catch (e: any) {
      if (sessionId !== liveSessionIdRef.current) return;
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to fetch");
    }
  }

  async function pollLiveOnce() {
    const seq = ++reqSeq.current;
    const mySession = liveSessionIdRef.current;

    try {
      const data = await fetchNews({ limit: 200 });
      if (seq !== reqSeq.current) return;
      if (modeRef.current !== "live") return;
      if (mySession !== liveSessionIdRef.current) return;

      const mapped = mapApiToUi(data);
      const seen = liveSeenRef.current;
      const fresh: UiNewsItem[] = [];

      for (const item of mapped) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          fresh.push(item);
        }
      }

      if (fresh.length > 0) {
        fresh.sort((a, b) => b.created_at.localeCompare(a.created_at));
        setItems((prev) => [...fresh, ...prev]);
      }

      setStatus("ok");
      setErrorMsg("");
    } catch (e: any) {
      if (seq !== reqSeq.current) return;
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to fetch");
    }
  }

  useEffect(() => {
    modeRef.current = "live";
    setMode("live");
    startLiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "live") return;
    const id = setInterval(() => {
      pollLiveOnce();
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== "history") return;
    loadHistory();
    const id = setInterval(loadHistory, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, historyLimit]);

  return (
    <div className="tid-panel-soft min-h-[760px] overflow-hidden">
      <div className="border-b border-[#182231] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                mode === "live"
                  ? "bg-[#083225] text-[#00f58b]"
                  : "bg-[#101723] text-[#7e8aa6] hover:text-white"
              }`}
              onClick={() => {
                modeRef.current = "live";
                setMode("live");
                startLiveSession();
              }}
            >
              LIVE
            </button>

            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                mode === "history"
                  ? "bg-[#083225] text-[#00f58b]"
                  : "bg-[#101723] text-[#7e8aa6] hover:text-white"
              }`}
              onClick={() => {
                modeRef.current = "history";
                setMode("history");
              }}
            >
              HISTORY
            </button>

            {mode === "history" && (
              <select
                className="tid-input h-10"
                value={historyLimit}
                onChange={(e) => setHistoryLimit(Number(e.target.value))}
              >
                {[25, 50, 100, 250, 500].map((n) => (
                  <option key={n} value={n}>
                    last {n}
                  </option>
                ))}
              </select>
            )}
          </div>

          {mode === "live" && (
            <button className="tid-btn-secondary h-10" onClick={startLiveSession}>
              END SESSION
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-[#182231] px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold tracking-[0.2em] text-[#00f58b]">
              LIVE TAPE
            </span>
            <span className="text-[#7e8aa6]">
              {mode === "live" ? `${sortedItems.length} new • polling 3s` : `${sortedItems.length} loaded`}
            </span>
          </div>

          <div className="text-xs text-[#7e8aa6]">
            {status === "loading" && "Loading..."}
            {status === "error" && errorMsg}
          </div>
        </div>
      </div>

      {sortedItems.length === 0 && status !== "error" ? (
        <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
          <div className="mb-4 h-3 w-3 rounded-full bg-[#00f58b]/80" />
          <div className="mb-2 text-lg text-[#a7b4cf]">Waiting for new items…</div>
          <div className="text-sm text-[#5c6780]">
            {mode === "live"
              ? "Session started • polling every 3s"
              : "No history items found"}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#182231]">
          {sortedItems.map((n) => (
            <div key={n.id} className="px-4 py-4 transition hover:bg-[#0a1019]">
              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em]">
                <span className="text-[#00f58b]">{n.source}</span>
                <span className="text-[#6f7c98]">
                  {new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="mb-3 text-base text-white">
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" className="hover:text-[#00f58b]">
                    {n.title}
                  </a>
                ) : (
                  n.title
                )}
              </div>

              {n.tickers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {n.tickers.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-[#0d6048] bg-[#07281e] px-2 py-1 text-xs text-[#00f58b]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="border-t border-[#3a1212] bg-[#1a0a0c] px-4 py-3 text-sm text-[#ff6b6b]">
          {errorMsg}
        </div>
      )}
    </div>
  );
}