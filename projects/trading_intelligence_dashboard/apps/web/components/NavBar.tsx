"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  dateText: string;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/screener", label: "Screener" },
  { href: "/ticker", label: "Ticker" },
];

export default function NavBar({ dateText }: Props) {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#182231] bg-[#050910]">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00f58b]" />
            <div className="flex items-baseline gap-2">
              <span className="font-semibold tracking-wide text-white">TID</span>
              <span className="text-sm text-[#7e8aa6]">Trading Intelligence</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-4 py-2 text-sm transition ${
                    active
                      ? "bg-[#07281e] text-[#00f58b]"
                      : "text-[#8f9bb3] hover:bg-[#0a1019] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#7e8aa6]">
          <span>{dateText}</span>
          <span className="text-lg">↪</span>
        </div>
      </div>
    </header>
  );
}