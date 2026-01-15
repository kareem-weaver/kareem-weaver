"use client";

import { useEffect, useState } from "react";

type ScreenerRow = {
  symbol: string;
  day: string;
  close: number;
  volume: number;
  prev_close: number | null;
  pct_change: number | null;
  avg_volume: number | null;
  rvol: number | null;
};

export default function ScreenerPage() {
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [minVolume, setMinVolume] = useState<number>(1);
  const [minRvol, setMinRvol] = useState<number>(1.0);
  const [limit, setLimit] = useState<number>(20);

  const API_BASE = "http://localhost:8000";

  const fetchScreener = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("min_volume", String(minVolume));
      params.set("min_rvol", String(minRvol));
      params.set("limit", String(limit));
      params.set("rvol_days", "20");

      const res = await fetch(`${API_BASE}/screener?${params.toString()}`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error (${res.status}): ${text}`);
      }

      const data = (await res.json()) as ScreenerRow[];
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Screener
      </h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Min Volume</div>
          <input
            type="number"
            value={minVolume}
            onChange={(e) => setMinVolume(Number(e.target.value))}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Min RVOL</div>
          <input
            type="number"
            step="0.1"
            value={minRvol}
            onChange={(e) => setMinRvol(Number(e.target.value))}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Limit</div>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </div>

        <button
          onClick={fetchScreener}
          style={{
            padding: "8px 14px",
            border: "1px solid #333",
            borderRadius: 6,
            cursor: "pointer",
            background: "white",
            height: 38,
            marginTop: 16,
          }}
        >
          Run
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={th}>Symbol</th>
              <th style={th}>Day</th>
              <th style={thRight}>Close</th>
              <th style={thRight}>Volume</th>
              <th style={thRight}>% Chg</th>
              <th style={thRight}>Avg Vol (20)</th>
              <th style={thRight}>RVOL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td style={td}>
                  <a href={`/ticker/${r.symbol}`} style={{ textDecoration: "underline" }}>
                    {r.symbol}
                  </a>
                </td>
                <td style={td}>{r.day}</td>
                <td style={tdRight}>{r.close.toFixed(2)}</td>
                <td style={tdRight}>{r.volume.toLocaleString()}</td>
                <td style={tdRight}>
                  {r.pct_change === null ? "—" : `${r.pct_change.toFixed(2)}%`}
                </td>
                <td style={tdRight}>
                  {r.avg_volume === null ? "—" : Math.round(r.avg_volume).toLocaleString()}
                </td>
                <td style={tdRight}>
                  {r.rvol === null ? "—" : r.rvol.toFixed(2)}
                </td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  No results. Try lowering Min RVOL or Min Volume.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 10,
  textAlign: "left",
  fontSize: 13,
};

const thRight: React.CSSProperties = {
  ...th,
  textAlign: "right",
};

const td: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 10,
  fontSize: 13,
};

const tdRight: React.CSSProperties = {
  ...td,
  textAlign: "right",
};

