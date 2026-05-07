"use client";

import { useEffect, useState } from "react";

export interface LBEntry { handle: string; score: number; ts: number; }

function formatHandle(h: string): string {
  return "@" + h;
}

export default function Leaderboard({
  highlightHandle,
  refreshKey,
  compact = false,
}: {
  highlightHandle?: string;
  refreshKey?: number;
  compact?: boolean;
}) {
  const [entries, setEntries] = useState<LBEntry[] | null>(null);
  const [mode, setMode] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.ok) {
          setEntries(d.entries as LBEntry[]);
          setMode(d.mode);
        } else {
          setEntries([]);
        }
      })
      .catch(() => !cancelled && setEntries([]));
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (entries === null) {
    return <div className="text-[#F0E7D4]/60 text-sm py-4">loading leaderboard...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className={`text-[#F0E7D4]/60 ${compact ? "text-xs" : "text-sm"} py-3 text-center`}>
        be the first on the board.
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`grid grid-cols-[36px_1fr_auto] gap-x-3 ${compact ? "text-xs" : "text-sm"}`}>
        {entries.slice(0, compact ? 5 : 10).map((e, i) => {
          const isMe = highlightHandle && e.handle === highlightHandle;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          return (
            <div
              key={e.handle}
              className={`contents ${isMe ? "font-bold" : ""}`}
            >
              <div className={`text-right ${i < 3 ? "text-base" : "text-[#F0E7D4]/60"} py-1`}>
                {medal ?? `#${i + 1}`}
              </div>
              <a
                href={`https://x.com/${e.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`truncate py-1 ${isMe ? "text-[#F08A3C]" : "text-[#F0E7D4] hover:text-[#D8488A]"} transition-colors`}
              >
                {formatHandle(e.handle)}
              </a>
              <div className={`font-graffiti tabular-nums py-1 ${isMe ? "text-[#F08A3C]" : "text-[#F0E7D4]"}`}>
                {e.score.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      {mode === "ephemeral" && !compact && (
        <p className="text-[#F0E7D4]/40 text-[10px] text-center mt-3 tracking-wider uppercase">
          ⚠ ephemeral mode · scores reset on server cold-start
        </p>
      )}
    </div>
  );
}
