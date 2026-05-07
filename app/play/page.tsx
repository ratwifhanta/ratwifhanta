import Link from "next/link";
import Game from "@/components/Game";

export const metadata = {
  title: "Spread the Hanta · $RAT",
  description: "play as the rat. infect the city. dodge the hazmat squad.",
};

export default function PlayPage() {
  return (
    <main className="relative w-full h-dvh overflow-hidden bg-[#1B1208]">
      {/* Floating home button — sits over the game */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-30 font-graffiti text-base md:text-lg px-4 py-2 rounded-xl bg-[#F0E7D4] text-[#1B1208] hover:bg-[#D8488A] hover:text-[#F0E7D4] transition-colors border-2 border-[#1B1208]"
      >
        ← Home
      </Link>

      <Game />
    </main>
  );
}
