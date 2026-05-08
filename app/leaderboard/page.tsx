"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderEntry {
  handle: string;
  score: number;
  ts: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"global" | "ephemeral">("ephemeral");

  const load = async (silent = false): Promise<void> => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const d = await res.json();
      setEntries(d.entries ?? []);
      setMode(d.mode ?? "ephemeral");
    } catch {
      // ignore — keep last good data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    // Auto-refresh every 5 seconds so new scores appear without a manual reload
    const id = window.setInterval(() => void load(true), 5000);
    // Refresh whenever the tab becomes visible again
    const onVis = (): void => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Link href="/token" className="font-graffiti text-base md:text-lg text-[#1B1208] hover:text-[#D8488A] transition-colors">
            Chart
          </Link>
        </div>
      </header>

      {/* Header */}
      <section className="px-4 md:px-10 pt-10 pb-6 text-center">
        <p className="font-graffiti text-xl text-[#6E2410] mb-1">// top spreaders</p>
        <h1 className="font-graffiti text-5xl md:text-7xl text-[#1B1208] leading-none">
          Leader<span className="text-[#D8488A]">board</span>
        </h1>
        <p className="text-[#3D2A18] mt-3 text-base max-w-md mx-auto">
          highest infection counts on record. top scorer gets rewarded in{" "}
          <span className="font-graffiti text-[#F08A3C]">SOL</span>.
        </p>
        {mode === "ephemeral" && (
          <p className="mt-2 text-xs text-[#6E2410]/60 bg-[#6E2410]/10 inline-block px-3 py-1 rounded-full">
            ephemeral mode — scores reset on server restart
          </p>
        )}
        <div className="mt-4">
          <button
            onClick={() => void load()}
            disabled={refreshing}
            className="font-graffiti text-sm px-4 py-2 rounded-full bg-[#1B1208]/10 text-[#1B1208] hover:bg-[#1B1208] hover:text-[#F0E7D4] transition disabled:opacity-50"
          >
            {refreshing ? "refreshing…" : "↻ refresh"}
          </button>
          <span className="ml-3 text-[#1B1208]/40 text-xs">auto-refreshes every 5s</span>
        </div>
      </section>

      {/* Table */}
      <section className="px-4 md:px-10 pb-20 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-20 font-graffiti text-2xl text-[#1B1208]/40 animate-pulse">
            loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-graffiti text-3xl text-[#1B1208]/40">no scores yet</p>
            <p className="text-[#3D2A18]/60 mt-2 text-sm">be the first — play the game and spread the hanta</p>
            <Link
              href="/play"
              className="inline-block mt-6 font-graffiti text-xl px-8 py-4 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#1B1208] transition-all border-4 border-[#1B1208]"
            >
              ▶ Play Now
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-[#1B1208] overflow-hidden bg-[#E8DCC4]">
            {/* Header row */}
            <div className="grid grid-cols-12 bg-[#1B1208] text-[#F0E7D4] px-4 py-3 text-xs font-bold tracking-widest uppercase">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-7 pl-2">Handle</div>
              <div className="col-span-4 text-right pr-2">Score</div>
            </div>

            {entries.map((e, i) => (
              <div
                key={e.handle}
                className={`grid grid-cols-12 px-4 py-3 items-center border-b border-[#1B120820] last:border-0 transition-colors hover:bg-[#1B120810] ${
                  i === 0 ? "bg-[#F08A3C]/15" : i === 1 ? "bg-[#1B1208]/08" : i === 2 ? "bg-[#1B1208]/05" : ""
                }`}
              >
                <div className="col-span-1 text-center">
                  {i < 3 ? (
                    <span className="text-xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="font-graffiti text-lg text-[#1B1208]/50">{i + 1}</span>
                  )}
                </div>
                <div className="col-span-7 pl-2">
                  <a
                    href={`https://x.com/${e.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-graffiti text-lg md:text-xl text-[#1B1208] hover:text-[#D8488A] transition-colors"
                  >
                    @{e.handle}
                  </a>
                </div>
                <div className="col-span-4 text-right pr-2">
                  <span className="font-graffiti text-xl md:text-2xl text-[#F08A3C]">
                    {e.score.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/play"
              className="inline-block font-graffiti text-xl md:text-2xl px-10 py-5 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#1B1208] transition-all border-4 border-[#1B1208] hover:scale-105"
            >
              ▶ Beat the Score
            </Link>
          </div>
        )}
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
