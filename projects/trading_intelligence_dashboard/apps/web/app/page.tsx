import Link from "next/link";

const cards = [
  {
    title: "Screener",
    desc: "Scan for movers, RVOL, and momentum.",
    href: "/screener",
  },
  {
    title: "News",
    desc: "Latest headlines tagged by ticker.",
    href: "/news",
  },
  {
    title: "Ticker",
    desc: "View a single ticker’s chart + stats.",
    href: "/ticker",
  },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Trading Intelligence Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Your hub for screening, ticker drilldowns, and news.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="text-lg font-medium">{c.title}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {c.desc}
            </div>
            <div className="mt-4 text-sm font-medium">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
