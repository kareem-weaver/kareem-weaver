"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchNews } from "@/lib/api";

type ApiNewsItem = {
  uid?: string;
  title: string;
  source?: string;
  url?: string;
  published_at?: string;
  symbols?: string[];
  score?: number;
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

function mapApiToUi(data: ApiNewsItem[]): UiNewsItem[] {
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
  // UI state
  const [items, setItems] = useState<UiNewsItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Modes
  // ✅ requirement: /news should be LIVE by default
  const [mode, setMode] = useState<"live" | "history">("live");
  const [historyLimit, setHistoryLimit] = useState(50);

  // ---- refs to avoid races / stale loads ----
  const modeRef = useRef<"live" | "history">(mode);
  const historyLimitRef = useRef(historyLimit);
  const reqSeq = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    historyLimitRef.current = historyLimit;
  }, [historyLimit]);

  // ---- LIVE session container (frontend-only) ----
  // seenRef = all UIDs that existed when session began + anything we’ve already appended
  const liveSeenRef = useRef<Set<string>>(new Set());
  // sessionId increments whenever a new live session starts (End session / switch to live)
  const liveSessionIdRef = useRef(0);

  const sortedItems = useMemo(() => {
    // minimal client work: stable ordering
    return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [items]);

  async function loadHistory() {
    const seq = ++reqSeq.current;
    try {
      setStatus((s) => (s === "idle" ? "loading" : s));

      const data: ApiNewsItem[] = await fetchNews({ limit: historyLimitRef.current });

      if (seq !== reqSeq.current) return;
      if (modeRef.current !== "history") return;

      const mapped = mapApiToUi(data);
      setItems(mapped);
      setStatus("ok");
      setErrorMsg("");
    } catch (e: any) {
      if (seq !== reqSeq.current) return;
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to load news");
    }
  }

  /**
   * Start a brand-new live session:
   * - Baseline by fetching latest N and marking them as seen (NOT displayed)
   * - Clear the visible tape to empty
   */
  async function startLiveSession() {
    // invalidate any in-flight request
    reqSeq.current += 1;
    const mySessionId = ++liveSessionIdRef.current;

    setItems([]); // ✅ empty by default
    setStatus("loading");
    setErrorMsg("");

    try {
      // baseline snapshot: mark current items as "already existed"
      const baseline: ApiNewsItem[] = await fetchNews({ limit: 200 });

      // if a newer live session started, ignore
      if (mySessionId !== liveSessionIdRef.current) return;
      if (modeRef.current !== "live") return;

      const mapped = mapApiToUi(baseline);
      const seen = new Set<string>();
      for (const it of mapped) seen.add(it.id);

      liveSeenRef.current = seen;

      // stay empty; we only show items that arrive AFTER this baseline
      setStatus("ok");
    } catch (e: any) {
      if (mySessionId !== liveSessionIdRef.current) return;
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to start live session");
    }
  }

  /**
   * Poll live:
   * - Fetch latest N
   * - Append only items not in liveSeenRef
   */
  async function pollLiveOnce() {
    const mySessionId = liveSessionIdRef.current;
    const seq = ++reqSeq.current;

    try {
      const data: ApiNewsItem[] = await fetchNews({ limit: 200 });

      if (seq !== reqSeq.current) return;
      if (modeRef.current !== "live") return;
      if (mySessionId !== liveSessionIdRef.current) return;

      const mapped = mapApiToUi(data);

      const seen = liveSeenRef.current;
      const newOnes: UiNewsItem[] = [];

      for (const it of mapped) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          newOnes.push(it);
        }
      }

      if (newOnes.length > 0) {
        // newest first so they "pop up at the top"
        newOnes.sort((a, b) => b.created_at.localeCompare(a.created_at));
        setItems((prev) => [...newOnes, ...prev]);
      }

      // keep status ok in live mode even if no new items
      setStatus("ok");
      setErrorMsg("");
    } catch (e: any) {
      if (seq !== reqSeq.current) return;
      setStatus("error");
      setErrorMsg(e?.message ?? "Live polling failed");
    }
  }

  // On first mount: LIVE by default + empty by default (start session baseline)
  useEffect(() => {
    modeRef.current = "live";
    setMode("live");
    startLiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling behavior
  useEffect(() => {
    if (mode !== "live") return;

    // poll every 3s in live
    const id = setInterval(() => {
      pollLiveOnce();
    }, 3000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // When switching to history, load it once (and refresh every 60s if you want)
  useEffect(() => {
    if (mode !== "history") return;

    loadHistory();
    const id = setInterval(loadHistory, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, historyLimit]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">News</h1>

        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              className={`px-3 py-1.5 ${mode === "live" ? "bg-black text-white" : ""}`}
              type="button"
              onClick={() => {
                // switch to live + start a fresh session (empty)
                modeRef.current = "live";
                setMode("live");
                startLiveSession();
              }}
            >
              Live
            </button>

            <button
              className={`px-3 py-1.5 ${mode === "history" ? "bg-black text-white" : ""}`}
              type="button"
              onClick={() => {
                modeRef.current = "history";
                setMode("history");
              }}
            >
              History
            </button>
          </div>

          {/* End session (only in live) */}
          {mode === "live" && (
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm"
              onClick={() => {
                // end/reset: new baseline, empty tape
                startLiveSession();
              }}
            >
              End session
            </button>
          )}

          {/* History limit */}
          {mode === "history" && (
            <select
              className="rounded-md border px-2 py-1.5 text-sm"
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

          {/* Status */}
          <div className="text-sm opacity-70 whitespace-nowrap">
            {status === "loading" && "Loading..."}
            {status === "ok" &&
              (mode === "live"
                ? `Live (session) • ${new Date().toLocaleTimeString()}`
                : `History • ${new Date().toLocaleTimeString()}`)}
            {status === "error" && "Error"}
          </div>
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
          <div className="rounded-md border p-3 text-sm opacity-70">
            {mode === "live"
              ? "No new news yet (live session starts empty)."
              : "No news found in history."}
          </div>
        )}
      </div>
    </div>
  );
}
