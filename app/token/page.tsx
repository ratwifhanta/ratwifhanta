import Link from "next/link";

export default function TokenPage() {
  return (
    <main className="relative min-h-dvh w-full bg-[#F0E7D4]">
      {/* Ticker */}
      <div className="relative z-30 border-y border-[#1B120840] bg-[#1B1208] text-[#F0E7D4] py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
              {Array.from({ length: 12 }).map((_, j) => (
                <span key={j} className="font-graffiti text-lg flex items-center gap-3">
                  <span>$RAT</span>
                  <span className="text-[#F08A3C]">•</span>
                  <span>ratwifhanta</span>
                  <span className="text-[#F08A3C]">•</span>
                  <span>spread the hanta</span>
                  <span className="text-[#F08A3C]">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <header className="px-6 md:px-10 pt-6 pb-2 flex items-center justify-between">
        <Link href="/" className="font-graffiti text-2xl md:text-3xl text-[#1B1208] flex items-center gap-2">
          <span className="text-[#D8488A]">$</span>RAT
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/play" className="font-graffiti text-base md:text-lg text-[#1B1208] hover:text-[#D8488A] transition-colors">
            ▶ Play
          </Link>
          <Link href="/leaderboard" className="font-graffiti text-base md:text-lg text-[#1B1208] hover:text-[#D8488A] transition-colors">
            Leaderboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 md:px-10 pt-12 pb-10 text-center">
        <p className="font-graffiti text-xl text-[#6E2410] mb-1">// the coin</p>
        <h1 className="font-graffiti text-5xl md:text-7xl text-[#1B1208] leading-none">
          <span className="text-[#D8488A]">$</span>RAT
        </h1>
        <p className="font-graffiti text-2xl text-[#F08A3C] mt-2">ratwifhanta</p>
        <p className="text-[#3D2A18] mt-4 text-base max-w-md mx-auto leading-relaxed">
          a lab rat escaped with the hanta virus as a hat. now he lives on solana.
        </p>
      </section>

      {/* Chart Area */}
      <section className="px-4 md:px-10 pb-16 max-w-5xl mx-auto">
        <div className="rounded-3xl border-4 border-[#1B1208] bg-[#E8DCC4] overflow-hidden">
          {/* Chart placeholder */}
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-6">
            <div className="text-6xl animate-bob">📈</div>
            <h2 className="font-graffiti text-3xl md:text-4xl text-[#1B1208]">
              chart coming soon
            </h2>
            <p className="text-[#3D2A18]/70 max-w-sm text-base leading-relaxed">
              $RAT launches soon on Solana. the chart will appear here once the contract is live.
            </p>
            <div className="w-full max-w-sm bg-[#1B1208]/10 rounded-2xl border-2 border-[#1B1208]/20 p-4">
              <p className="text-xs text-[#6E2410] uppercase tracking-widest mb-1">contract address</p>
              <p className="font-mono text-[#1B1208]/40 text-sm">TBA on launch</p>
            </div>
          </div>
        </div>

        {/* Stats placeholders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "price", value: "TBA" },
            { label: "market cap", value: "TBA" },
            { label: "holders", value: "TBA" },
            { label: "chain", value: "SOLANA" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border-4 border-[#1B1208] bg-[#E8DCC4] p-4 text-center">
              <p className="text-xs text-[#6E2410] uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-graffiti text-xl ${value === "TBA" ? "text-[#1B1208]/30" : "text-[#F08A3C]"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://x.com/RatWifHanta"
            target="_blank"
            rel="noopener noreferrer"
            className="font-graffiti text-xl px-8 py-4 rounded-2xl bg-[#1B1208] text-[#F0E7D4] hover:bg-[#D8488A] transition-all border-4 border-[#1B1208] text-center hover:scale-105"
          >
            Follow @RatWifHanta
          </a>
          <Link
            href="/play"
            className="font-graffiti text-xl px-8 py-4 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] transition-all border-4 border-[#1B1208] text-center hover:scale-105"
          >
            ▶ Play Game
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-10 py-10 border-t-4 border-[#1B1208] bg-[#1B1208] text-[#F0E7D4]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-graffiti text-2xl"><span className="text-[#D8488A]">$</span>RAT · ratwifhanta</div>
          <p className="text-xs text-[#C9B998] tracking-widest uppercase">not financial advice. it&apos;s a rat.</p>
        </div>
      </footer>
    </main>
  );
}
