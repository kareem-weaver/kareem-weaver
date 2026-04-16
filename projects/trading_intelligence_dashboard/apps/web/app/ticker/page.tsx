"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Candle, fetchCandles } from "@/lib/api";

const CHART_WIDTH = 900;
const CHART_HEIGHT = 260;
const CHART_PAD = 24;

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getPriceBounds(candles: Candle[]) {
  if (candles.length === 0) {
    return { low: null, high: null };
  }

  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;

  for (const candle of candles) {
    low = Math.min(low, candle.low);
    high = Math.max(high, candle.high);
  }

  return {
    low: Number.isFinite(low) ? low : null,
    high: Number.isFinite(high) ? high : null,
  };
}

function SimpleLineChart({ candles }: { candles: Candle[] }) {
  const bounds = useMemo(() => getPriceBounds(candles), [candles]);
  const closes = useMemo(() => candles.map((c) => c.close).filter((v) => !Number.isNaN(v)), [candles]);
  const points = useMemo(() => {
    if (closes.length === 0) return "";

    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;

    return closes
      .map((value, i) => {
        const x = CHART_PAD + (i * (CHART_WIDTH - CHART_PAD * 2)) / Math.max(closes.length - 1, 1);
        const y =
          CHART_HEIGHT -
          CHART_PAD -
          ((value - min) / range) * (CHART_HEIGHT - CHART_PAD * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [closes]);

  const lastPoint = points.split(" ").at(-1);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-[#7e8aa6]">
        <span>{bounds.high != null ? `High $${bounds.high.toFixed(2)}` : "High —"}</span>
        <span>{bounds.low != null ? `Low $${bounds.low.toFixed(2)}` : "Low —"}</span>
      </div>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[260px] w-full">
        <defs>
          <linearGradient id="lineGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00f58b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00f58b" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill="#070c14" />
        <path d="M24 42 H876 M24 130 H876 M24 218 H876" stroke="#132033" strokeWidth="1" />
        <polyline
          fill="none"
          stroke="#00f58b"
          strokeWidth="3"
          points={points}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {lastPoint ? <circle cx={lastPoint.split(",")[0]} cy={lastPoint.split(",")[1]} r="4" fill="#00f58b" /> : null}
      </svg>
    </div>
  );
}

function CandlestickChart({ candles }: { candles: Candle[] }) {
  const bounds = useMemo(() => getPriceBounds(candles), [candles]);
  const segments = useMemo(() => {
    if (candles.length === 0 || bounds.low == null || bounds.high == null) {
      return [];
    }

    const range = bounds.high - bounds.low || 1;
    const slotWidth = (CHART_WIDTH - CHART_PAD * 2) / Math.max(candles.length, 1);
    const bodyWidth = Math.max(3, Math.min(slotWidth * 0.65, 10));

    const scaleY = (value: number) =>
      CHART_HEIGHT -
      CHART_PAD -
      ((value - bounds.low!) / range) * (CHART_HEIGHT - CHART_PAD * 2);

    return candles.map((candle, index) => {
      const xCenter = CHART_PAD + slotWidth * index + slotWidth / 2;
      const openY = scaleY(candle.open);
      const closeY = scaleY(candle.close);
      const highY = scaleY(candle.high);
      const lowY = scaleY(candle.low);
      const isUp = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

      return {
        key: `${candle.symbol}-${candle.day}`,
        xCenter,
        bodyX: xCenter - bodyWidth / 2,
        bodyTop,
        bodyHeight,
        bodyWidth,
        highY,
        lowY,
        isUp,
      };
    });
  }, [bounds, candles]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-[#7e8aa6]">
        <span>{bounds.high != null ? `High $${bounds.high.toFixed(2)}` : "High —"}</span>
        <span>{bounds.low != null ? `Low $${bounds.low.toFixed(2)}` : "Low —"}</span>
      </div>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[260px] w-full">
        <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill="#070c14" />
        <path d="M24 42 H876 M24 130 H876 M24 218 H876" stroke="#132033" strokeWidth="1" />
        {segments.map((segment) => (
          <g key={segment.key}>
            <line
              x1={segment.xCenter}
              x2={segment.xCenter}
              y1={segment.highY}
              y2={segment.lowY}
              stroke={segment.isUp ? "#00f58b" : "#ff6b6b"}
              strokeWidth="1.5"
            />
            <rect
              x={segment.bodyX}
              y={segment.bodyTop}
              width={segment.bodyWidth}
              height={segment.bodyHeight}
              rx="1"
              fill={segment.isUp ? "#00f58b" : "#ff6b6b"}
              fillOpacity={segment.isUp ? "0.9" : "0.85"}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function TickerPage() {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState("");
  const [active, setActive] = useState("");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [chartType, setChartType] = useState<"line" | "candles">("line");

  const quickNames = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "SPY", "QQQ"];

  async function runLookup(nextSymbol?: string) {
    const useSymbol = (nextSymbol ?? symbol).trim().toUpperCase();
    if (!useSymbol) return;

    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchCandles(useSymbol, 90);
      setCandles(data);
      setActive(useSymbol);
      setSymbol(useSymbol);
    } catch (e: unknown) {
      setErrorMsg(toErrorMessage(e, "Failed to load ticker"));
      setCandles([]);
      setActive(useSymbol);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const querySymbol = searchParams.get("symbol")?.trim().toUpperCase();
    if (querySymbol && querySymbol !== active) {
      setSymbol(querySymbol);
      void runLookup(querySymbol);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, active]);

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];
  const priceChange =
    firstCandle && lastCandle && firstCandle.close !== 0
      ? ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100
      : null;
  const dateRange =
    firstCandle && lastCandle
      ? `${new Date(`${firstCandle.day}T00:00:00`).toLocaleDateString()} - ${new Date(`${lastCandle.day}T00:00:00`).toLocaleDateString()}`
      : "No data";

  const isEmptyState = candles.length === 0;

  return (
    <div className="tid-panel-soft min-h-[760px] overflow-hidden">
      <div className="border-b border-[#182231] px-4 py-4">
        <div className="flex max-w-[760px] items-center gap-3">
          <input
            className="tid-input flex-1"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void runLookup();
              }
            }}
            placeholder="Enter Nasdaq / NYSE ticker (e.g. AAPL, KO, BRK.B)"
          />
          <button className="tid-btn-primary min-w-[120px]" onClick={() => runLookup()}>
            {loading ? "..." : "LOOKUP"}
          </button>
        </div>
        <div className="mt-2 text-xs text-[#7e8aa6]">
          First lookup fetches real daily candles and stores them locally for later use.
        </div>
      </div>

      {isEmptyState ? (
        <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
          <div className="mb-4 text-3xl text-[#1e2a3f]">↗</div>
          <div className="mb-3 text-lg text-[#a7b4cf]">
            {errorMsg ? `No candle history available for ${active || "that symbol"}` : "Enter a ticker symbol to begin"}
          </div>

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
                  <div className="mt-1 text-xs text-[#7e8aa6]">{dateRange}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 rounded border border-[#182231] bg-[#0a1019] p-1">
                    {[
                      { id: "line", label: "LINE" },
                      { id: "candles", label: "CANDLES" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setChartType(option.id as "line" | "candles")}
                        className={`rounded px-2 py-1 ${
                          chartType === option.id
                            ? "bg-[#083225] text-[#00f58b]"
                            : "text-[#7e8aa6] hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <span className="rounded border border-[#182231] px-2 py-1">90D</span>
                </div>
              </div>
              {chartType === "candles" ? (
                <CandlestickChart candles={candles} />
              ) : (
                <SimpleLineChart candles={candles} />
              )}
            </div>

            <div className="space-y-4">
              <div className="tid-panel p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
                  Latest Close
                </div>
                <div className="text-3xl font-semibold text-white">
                  ${Number(lastCandle?.close ?? 0).toFixed(2)}
                </div>
                <div className={`mt-2 text-sm font-semibold ${priceChange != null && priceChange >= 0 ? "text-[#00f58b]" : "text-[#ff6b6b]"}`}>
                  {priceChange != null ? `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}% vs first candle` : "—"}
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
                      {lastCandle?.volume != null
                        ? Number(lastCandle.volume).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7e8aa6]">Range</span>
                    <span className="text-white">
                      {firstCandle && lastCandle ? `$${firstCandle.close.toFixed(2)} -> $${lastCandle.close.toFixed(2)}` : "—"}
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
