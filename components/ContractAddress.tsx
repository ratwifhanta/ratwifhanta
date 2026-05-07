"use client";

import { useState } from "react";

export const CONTRACT_ADDRESS = "8GkazeoAPYJAALfW4wAMzJhf4kmkzj4CYYRJoRqbpump";
export const PUMP_URL = `https://pump.fun/coin/${CONTRACT_ADDRESS}`;
export const DEXSCREENER_URL = `https://dexscreener.com/solana/${CONTRACT_ADDRESS}`;

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
      className={`rounded-2xl border-4 ${
        isDark
          ? "border-[#F0E7D4] bg-[#1B1208] text-[#F0E7D4]"
          : "border-[#1B1208] bg-[#F0E7D4] text-[#1B1208]"
      } p-4 md:p-5 flex flex-col sm:flex-row items-center gap-3`}
    >
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p
          className={`text-xs uppercase tracking-widest ${
            isDark ? "text-[#F08A3C]" : "text-[#6E2410]"
          } mb-1`}
        >
          contract address · solana
        </p>
        <p className="font-mono text-xs sm:text-sm md:text-base break-all">
          {CONTRACT_ADDRESS}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={onCopy}
          className={`font-graffiti text-base px-4 py-2 rounded-xl border-2 transition ${
            isDark
              ? "border-[#F0E7D4] bg-[#F0E7D4] text-[#1B1208] hover:bg-[#D8488A] hover:text-[#F0E7D4] hover:border-[#D8488A]"
              : "border-[#1B1208] bg-[#1B1208] text-[#F0E7D4] hover:bg-[#D8488A] hover:border-[#D8488A]"
          }`}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
        <a
          href={PUMP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-graffiti text-base px-4 py-2 rounded-xl border-2 border-[#D8488A] bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] hover:border-[#F08A3C] transition"
        >
          buy on pump.fun
        </a>
      </div>
    </div>
  );
}
