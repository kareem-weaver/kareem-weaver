import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/screener", label: "Screener" },
  { href: "/news", label: "News" },
  { href: "/ticker/AAPL", label: "Ticker" }, // placeholder example
];

export default function NavBar() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Trading Intel
        </Link>

        <nav className="flex gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
