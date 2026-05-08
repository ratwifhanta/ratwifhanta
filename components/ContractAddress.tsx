"use client";

import { useState } from "react";

export const CONTRACT_ADDRESS = "8GkazeoAPYJAALfW4wAMzJhf4kmkzj4CYYRJoRqbpump";
export const PUMP_URL = `https://pump.fun/coin/${CONTRACT_ADDRESS}`;
export const DEXSCREENER_URL = `https://dexscreener.com/solana/${CONTRACT_ADDRESS}`;
export const BIRDEYE_URL = `https://birdeye.so/token/${CONTRACT_ADDRESS}?chain=solana`;

const truncate = (addr: string): string =>
  `${addr.slice(0, 6)}…${addr.slice(-6)}`;

export function ContractAddress({
  variant = "light",
}: {
  variant?: "light" | "dark";
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border-2 ${
        isDark
          ? "border-[#F0E7D4]/30 bg-[#1B1208] text-[#F0E7D4]"
          : "border-[#1B1208]/15 bg-[#F0E7D4]/80 backdrop-blur text-[#1B1208]"
      } pl-4 pr-1 py-1 shadow-sm max-w-full`}
    >
      <span
        className={`text-[10px] uppercase tracking-widest ${
          isDark ? "text-[#F08A3C]" : "text-[#6E2410]"
        } font-graffiti`}
      >
        $RAT
      </span>
      <button
        onClick={onCopy}
        className="font-mono text-xs sm:text-sm hover:text-[#D8488A] transition-colors truncate"
        title="click to copy full address"
      >
        <span className="hidden sm:inline">{CONTRACT_ADDRESS}</span>
        <span className="sm:hidden">{truncate(CONTRACT_ADDRESS)}</span>
      </button>
      <button
        onClick={onCopy}
        className={`text-xs px-2 py-1 rounded-full transition ${
          isDark
            ? "bg-[#F0E7D4]/10 hover:bg-[#F0E7D4]/20 text-[#F0E7D4]"
            : "bg-[#1B1208]/5 hover:bg-[#1B1208]/15 text-[#1B1208]"
        }`}
        aria-label="copy contract address"
      >
        {copied ? "✓" : "copy"}
      </button>
      <a
        href={PUMP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1 rounded-full bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] transition font-graffiti"
      >
        buy ↗
      </a>
    </div>
  );
}
