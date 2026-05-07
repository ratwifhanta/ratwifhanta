import Link from "next/link";
import {
  ContractAddress,
  CONTRACT_ADDRESS,
  DEXSCREENER_URL,
  PUMP_URL,
} from "@/components/ContractAddress";

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
        <div className="rounded-3xl border-4 border-[#1B1208] bg-[#1B1208] overflow-hidden">
          <iframe
            src={`https://dexscreener.com/solana/${CONTRACT_ADDRESS}?embed=1&theme=dark&trades=0&info=0`}
            title="$RAT chart"
            className="w-full"
            style={{ height: "640px", border: 0 }}
            allow="clipboard-write"
          />
        </div>

        {/* Contract address bar */}
        <div className="mt-6">
          <ContractAddress variant="light" />
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <a
            href={PUMP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-graffiti text-xl px-8 py-4 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] transition-all border-4 border-[#1B1208] text-center hover:scale-105"
          >
            buy on pump.fun
          </a>
          <a
            href={DEXSCREENER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-graffiti text-xl px-8 py-4 rounded-2xl bg-[#1B1208] text-[#F0E7D4] hover:bg-[#D8488A] transition-all border-4 border-[#1B1208] text-center hover:scale-105"
          >
            view on dexscreener
          </a>
          <a
            href="https://x.com/RatWifHanta"
            target="_blank"
            rel="noopener noreferrer"
            className="font-graffiti text-xl px-8 py-4 rounded-2xl bg-transparent text-[#1B1208] hover:bg-[#1B1208] hover:text-[#F0E7D4] transition-all border-4 border-[#1B1208] text-center hover:scale-105"
          >
            @RatWifHanta
          </a>
          <Link
            href="/play"
            className="font-graffiti text-xl px-8 py-4 rounded-2xl bg-[#F08A3C] text-[#1B1208] hover:bg-[#D8488A] hover:text-[#F0E7D4] transition-all border-4 border-[#1B1208] text-center hover:scale-105"
          >
            ▶ play game
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
