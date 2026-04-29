import Link from "next/link";

const cards = [
  {
    title: "Live News",
    description: "Real-time regulatory and catalyst headlines with live tape mode",
    href: "/news",
    active: true,
  },
  {
    title: "Screener",
    description: "Scan stocks by price action, volume, signals, and fundamentals",
    href: "/screener",
    active: false,
  },
  {
    title: "Ticker Lookup",
    description: "Inspect any stock with charts, stats, and related catalysts",
    href: "/ticker",
    active: false,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[980px] py-10">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[#00f58b]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00f58b]" />
          System Online
        </div>

        <h1 className="mb-4 text-5xl font-semibold tracking-tight text-white">
          Trading Intelligence Dashboard
        </h1>

        <p className="mx-auto max-w-2xl text-lg leading-8 text-[#7e8aa6]">
          Monitor real-time regulatory catalysts, scan market opportunities,
          and track stock movements — all in one focused workstation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`tid-panel p-6 transition hover:border-[#284059] ${
              card.active ? "border-[#0c6f51] bg-[#061711]" : ""
            }`}
          >
            <div className="mb-5 text-[#00f58b]">▣</div>
            <h2 className="mb-3 text-2xl font-semibold text-white">{card.title}</h2>
            <p className="text-sm leading-7 text-[#7e8aa6]">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="tid-panel-soft p-5">
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7e8aa6]">Live Feed</div>
          <div className="font-semibold text-white">Active</div>
        </div>
        <div className="tid-panel-soft p-5">
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7e8aa6]">Screener</div>
          <div className="font-semibold text-white">Ready</div>
        </div>
        <div className="tid-panel-soft p-5">
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7e8aa6]">Latency</div>
          <div className="font-semibold text-white">&lt;5s</div>
        </div>
      </div>
    </div>
  );
}