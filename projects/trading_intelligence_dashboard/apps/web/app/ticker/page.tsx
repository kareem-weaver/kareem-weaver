"use client";

import { useMemo, useState } from "react";
import { Candle, fetchCandles } from "@/lib/api";

function SimpleLineChart({ candles }: { candles: Candle[] }) {
  const points = useMemo(() => {
    const closes = candles
      .map((c) => Number(c.close))
      .filter((v) => !Number.isNaN(v));

    if (closes.length === 0) return "";

    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const width = 900;
    const height = 260;
    const pad = 24;
    const range = max - min || 1;

    return closes
      .map((value, i) => {
        const x = pad + (i * (width - pad * 2)) / Math.max(closes.length - 1, 1);
        const y = height - pad - ((value - min) / range) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [candles]);

  return (
    <svg viewBox="0 0 900 260" className="h-[260px] w-full">
      <defs>
        <linearGradient id="lineGlow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00f58b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00f58b" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="900" height="260" fill="#070c14" />
      <polyline
        fill="none"
        stroke="#00f58b"
        strokeWidth="3"
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TickerPage() {
  const [symbol, setSymbol] = useState("");
  const [active, setActive] = useState("");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const quickNames = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "SPY", "QQQ"];

  async function runLookup(nextSymbol?: string) {
    const useSymbol = (nextSymbol ?? symbol).trim().toUpperCase();
    if (!useSymbol) return;

    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchCandles(useSymbol);
      setCandles(data);
      setActive(useSymbol);
      setSymbol(useSymbol);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load ticker");
      setCandles([]);
      setActive(useSymbol);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tid-panel-soft min-h-[760px] overflow-hidden">
      <div className="border-b border-[#182231] px-4 py-4">
        <div className="flex max-w-[760px] items-center gap-3">
          <input
            className="tid-input flex-1"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter ticker symbol (e.g. AAPL)"
          />
          <button className="tid-btn-primary min-w-[120px]" onClick={() => runLookup()}>
            {loading ? "..." : "LOOKUP"}
          </button>
        </div>
      </div>

      {candles.length === 0 ? (
        <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
          <div className="mb-4 text-3xl text-[#1e2a3f]">↗</div>
          <div className="mb-3 text-lg text-[#a7b4cf]">Enter a ticker symbol to begin</div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickNames.map((name) => (
              <button
                key={name}
                onClick={() => runLookup(name)}
                className="rounded border border-[#0d6048] bg-[#07281e] px-3 py-1.5 text-xs text-[#00f58b]"
              >
                {name}
              </button>
            ))}
          </div>

          {errorMsg && <div className="mt-5 text-sm text-[#ff6b6b]">{errorMsg}</div>}
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4 grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
            <div className="tid-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">Ticker</div>
                  <div className="text-3xl font-semibold text-white">{active}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7e8aa6]">
                  {["1D", "5D", "1M", "3M", "1Y"].map((x) => (
                    <span key={x} className="rounded border border-[#182231] px-2 py-1">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
              <SimpleLineChart candles={candles} />
            </div>

            <div className="space-y-4">
              <div className="tid-panel p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
                  Latest Close
                </div>
                <div className="text-3xl font-semibold text-white">
                  ${Number(candles[candles.length - 1]?.close ?? 0).toFixed(2)}
                </div>
              </div>

              <div className="tid-panel p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
                  Key Stats
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#7e8aa6]">Candles</span>
                    <span className="text-white">{candles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7e8aa6]">Latest Volume</span>
                    <span className="text-white">
                      {candles[candles.length - 1]?.volume != null
                        ? Number(candles[candles.length - 1]?.volume).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {errorMsg && <div className="text-sm text-[#ff6b6b]">{errorMsg}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}