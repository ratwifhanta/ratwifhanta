import Link from "next/link";
import Image from "next/image";
import { ContractAddress } from "@/components/ContractAddress";

export default function Home() {
  return (
    <main className="relative min-h-dvh w-full">
      {/* Floating drifting virus particles in background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[12%] left-[8%] w-24 h-24 opacity-25 animate-drift">
          <Image src="/virus.jpg" alt="" fill className="rounded-full mix-blend-multiply" />
        </div>
        <div className="absolute top-[55%] right-[6%] w-32 h-32 opacity-20 animate-drift" style={{ animationDelay: "-4s", animationDuration: "22s" }}>
          <Image src="/virus.jpg" alt="" fill className="rounded-full mix-blend-multiply" />
        </div>
        <div className="absolute bottom-[15%] left-[15%] w-20 h-20 opacity-25 animate-drift" style={{ animationDelay: "-9s", animationDuration: "26s" }}>
          <Image src="/virus.jpg" alt="" fill className="rounded-full mix-blend-multiply" />
        </div>
      </div>

      {/* Top sticky ticker */}
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

      {/* Top nav */}
      <header className="relative z-20 px-6 md:px-10 pt-6 pb-2 flex items-center justify-between">
        <div className="font-graffiti text-2xl md:text-3xl text-[#1B1208] flex items-center gap-2">
          <span className="text-[#D8488A]">$</span>RAT
        </div>
        <nav className="flex items-center gap-5 md:gap-6">
          <Link href="/leaderboard" className="font-graffiti text-base md:text-lg text-[#1B1208] hover:text-[#D8488A] transition-colors">
            Leaderboard
          </Link>
          <Link href="/token" className="font-graffiti text-base md:text-lg text-[#1B1208] hover:text-[#D8488A] transition-colors">
            Chart
          </Link>
          <a
            href="https://x.com/RatWifHanta"
            target="_blank"
            rel="noopener noreferrer"
            className="font-graffiti text-base md:text-xl text-[#1B1208] hover:text-[#D8488A] transition-colors flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @RatWifHanta
          </a>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 px-4 md:px-10 pt-8 md:pt-12 pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Live contract address — sits above the rat logo */}
          <div className="mb-6 md:mb-8 flex justify-center">
            <ContractAddress variant="light" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left — text */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <p className="font-graffiti text-lg md:text-xl text-[#6E2410] tracking-widest mb-4">
                solana &middot; the rat that escaped
              </p>

              <h1 className="font-graffiti text-[64px] sm:text-[88px] md:text-[120px] lg:text-[148px] leading-[0.85] text-[#1B1208] mb-2">
                Rat<span className="text-[#D8488A]">Wif</span>
                <br className="hidden sm:block" />
                Hanta
              </h1>

              <p className="font-graffiti text-3xl md:text-4xl text-[#F08A3C] mb-8 mt-4">
                $RAT
              </p>

              <p className="text-base md:text-lg text-[#3D2A18] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                patient zero is a rat in a crochet hat. he&apos;s coughing on
                solana, infecting wallets one block at a time, and he didn&apos;t
                ask for permission.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                <Link
                  href="/play"
                  className="group relative font-graffiti text-2xl md:text-3xl px-10 py-5 rounded-2xl bg-[#1B1208] text-[#F0E7D4] hover:bg-[#D8488A] transition-all duration-200 animate-pulse-glow border-4 border-[#1B1208] hover:scale-105"
                >
                  <span className="relative z-10">▶ Play Game</span>
                </Link>

                <a
                  href="https://x.com/RatWifHanta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-graffiti text-xl md:text-2xl px-8 py-5 rounded-2xl bg-transparent border-4 border-[#1B1208] text-[#1B1208] hover:bg-[#1B1208] hover:text-[#F0E7D4] transition-all duration-200 hover:scale-105"
                >
                  Follow on X
                </a>
              </div>
            </div>

            {/* Right — official PFP (matches X profile picture) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] animate-bob">
                <div className="absolute inset-0 rounded-full overflow-hidden ring-8 ring-[#1B1208] shadow-[0_20px_60px_rgba(27,18,8,0.4)]">
                  <Image
                    src="/pfp.png"
                    alt="ratwifhanta"
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 640px) 300px, (max-width: 768px) 380px, 440px"
                    className="object-cover"
                  />
                </div>
                {/* Sparkle accents */}
                <div className="absolute -top-2 right-10 text-3xl">✦</div>
                <div className="absolute bottom-4 -left-2 text-2xl">✦</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* LORE / ABOUT SECTION */}
      <section className="relative z-10 px-4 md:px-10 py-20 md:py-32 border-t-4 border-[#1B1208] bg-[#E8DCC4]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14 md:mb-20">
            <p className="font-graffiti text-xl md:text-2xl text-[#6E2410] mb-2">// the story</p>
            <h2 className="font-graffiti text-5xl md:text-7xl lg:text-8xl text-[#1B1208] leading-none">
              he was <span className="text-[#D8488A]">never</span>
              <br />
              supposed to escape.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <LoreCard
              num="01"
              title="the lab"
              body="somewhere in a basement, a rat with a mask got infected. they thought he was contained. they were wrong."
            />
            <LoreCard
              num="02"
              title="the leak"
              body="he found a vent. now he&apos;s wearing the particle like a helmet and posting on X. nobody saw it coming."
              highlight
            />
            <LoreCard
              num="03"
              title="the spread"
              body="every wallet that holds $RAT joins the colony. the more we are, the faster the hanta moves. wif us or against us."
            />
          </div>

          <div className="mt-14 md:mt-20 text-center">
            <p className="font-graffiti text-2xl md:text-3xl text-[#1B1208] mb-6">
              ready to spread?
            </p>
            <Link
              href="/play"
              className="inline-block font-graffiti text-xl md:text-2xl px-10 py-5 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#1B1208] transition-all duration-200 border-4 border-[#1B1208] hover:scale-105"
            >
              ▶ enter the city
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-4 md:px-10 py-12 border-t-4 border-[#1B1208] bg-[#1B1208] text-[#F0E7D4]">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-graffiti text-3xl md:text-4xl">
            <span className="text-[#D8488A]">$</span>RAT
            <span className="text-[#F08A3C] mx-3">·</span>
            ratwifhanta
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <a
              href="https://x.com/RatWifHanta"
              target="_blank"
              rel="noopener noreferrer"
              className="font-graffiti text-lg md:text-xl hover:text-[#D8488A] transition-colors flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @RatWifHanta
            </a>
            <span className="text-[#F08A3C] hidden sm:block">·</span>
            <p className="text-xs text-[#C9B998] tracking-widest uppercase">
              not financial advice. it&apos;s a rat.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function LoreCard({
  num,
  title,
  body,
  highlight = false,
}: {
  num: string;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border-4 border-[#1B1208] p-6 md:p-8 transition-transform hover:-translate-y-1 ${
        highlight
          ? "bg-[#1B1208] text-[#F0E7D4]"
          : "bg-[#F0E7D4] text-[#1B1208]"
      }`}
    >
      <div
        className={`font-graffiti text-5xl md:text-6xl mb-3 ${
          highlight ? "text-[#F08A3C]" : "text-[#D8488A]"
        }`}
      >
        {num}
      </div>
      <h3 className="font-graffiti text-2xl md:text-3xl mb-3">{title}</h3>
      <p className={`text-sm md:text-base leading-relaxed ${highlight ? "text-[#E8DCC4]" : "text-[#3D2A18]"}`}>
        {body}
      </p>
    </div>
  );
}
