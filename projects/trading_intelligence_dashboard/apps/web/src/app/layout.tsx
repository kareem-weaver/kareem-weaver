import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Trading Intelligence Dashboard",
  description: "Live regulatory/news tape and trading screener",
};

function formatTopRightDate() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dateText = formatTopRightDate();

  return (
    <html lang="en">
      <body className="bg-[#04070d] text-[#d7e3ff] antialiased">
        <div className="min-h-screen bg-[#04070d]">
          <NavBar dateText={dateText} />
          <main className="mx-auto w-full max-w-[1400px] px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}