"use client";

import { useEffect, useState } from "react";
import { fetchScreener, ScreenerRow } from "@/lib/api";

export default function ScreenerPage() {
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [minVolume, setMinVolume] = useState("");
  const [minRvol, setMinRvol] = useState("1");
  const [minChg, setMinChg] = useState("");
  const [maxChg, setMaxChg] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [limit, setLimit] = useState("50");

  async function run() {
    try {
      setLoading(true);
      setErrorMsg("");

      const data = await fetchScreener({
        min_volume: minVolume ? Number(minVolume) : undefined,
        min_rvol: minRvol ? Number(minRvol) : undefined,
        min_pct_change: minChg ? Number(minChg) : undefined,
        max_pct_change: maxChg ? Number(maxChg) : undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        limit: limit ? Number(limit) : 50,
      });

      setRows(data);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to fetch screener");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tid-panel-soft overflow-hidden">
      <div className="border-b border-[#182231] px-4 py-4">
        <div className="grid gap-3 md:grid-cols-7">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
              Min Volume
            </label>
            <input className="tid-input w-full" placeholder="e.g. 500000" value={minVolume} onChange={(e) => setMinVolume(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
              Min RVOL
            </label>
            <input className="tid-input w-full" value={minRvol} onChange={(e) => setMinRvol(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
              Min Chg %
            </label>
            <input className="tid-input w-full" placeholder="e.g. -5" value={minChg} onChange={(e) => setMinChg(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
              Max Chg %
            </label>
            <input className="tid-input w-full" placeholder="e.g. 20" value={maxChg} onChange={(e) => setMaxChg(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
              Min Price
            </label>
            <input className="tid-input w-full" placeholder="e.g. 1" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
              Max Price
            </label>
            <input className="tid-input w-full" placeholder="e.g. 500" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#7e8aa6]">
                Limit
              </label>
              <input className="tid-input w-full" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button className="tid-btn-primary w-full" onClick={run}>
                {loading ? "..." : "RUN"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#182231] px-4 py-3 text-sm text-[#7e8aa6]">
        {loading ? "Loading…" : `${rows.length} results`}
      </div>

      {errorMsg ? (
        <div className="px-4 py-3 text-sm text-[#ff6b6b]">{errorMsg}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#182231] text-left text-[#7e8aa6]">
              <tr>
                <th className="px-4 py-4 font-medium">Symbol</th>
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Close</th>
                <th className="px-4 py-4 font-medium">Chg %</th>
                <th className="px-4 py-4 font-medium">Volume</th>
                <th className="px-4 py-4 font-medium">Avg Vol</th>
                <th className="px-4 py-4 font-medium">RVOL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.symbol}-${row.day}`} className="border-b border-[#101827] hover:bg-[#09111b]">
                  <td className="px-4 py-4 font-semibold text-[#00f58b]">{row.symbol}</td>
                  <td className="px-4 py-4 text-white">{row.day}</td>
                  <td className="px-4 py-4 text-white">
                    {row.close != null ? `$${row.close.toFixed(2)}` : "—"}
                  </td>
                  <td className={`px-4 py-4 font-semibold ${row.pct_change != null && row.pct_change >= 0 ? "text-[#00f58b]" : "text-[#ff6b6b]"}`}>
                    {row.pct_change != null ? `${row.pct_change > 0 ? "+" : ""}${row.pct_change.toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-4 text-white">
                    {row.volume != null ? `${(row.volume / 1_000_000).toFixed(1)}M` : "—"}
                  </td>
                  <td className="px-4 py-4 text-white">
                    {row.avg_volume != null ? `${(row.avg_volume / 1_000_000).toFixed(1)}M` : "—"}
                  </td>
                  <td className="px-4 py-4 font-semibold text-white">
                    {row.rvol != null ? `${row.rvol.toFixed(2)}x` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}