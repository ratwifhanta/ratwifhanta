// Leaderboard storage abstraction.
// - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set → global leaderboard via Upstash sorted set
// - Otherwise → null (the API route falls back to in-memory; client falls back to localStorage)
import { Redis } from "@upstash/redis";

export interface LeaderEntry {
  handle: string;     // x handle, normalized to lowercase, no @
  score: number;
  ts: number;         // last-updated timestamp
}

const ZKEY = "ratwifhanta:lb";
const HKEY = "ratwifhanta:meta";   // hash: handle -> last-update timestamp

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export function isGlobalEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// In-memory fallback so dev mode (no env vars) still feels real.
// NOTE: this resets on every serverless cold start in production.
const memScores: Map<string, number> = new Map();
const memTs: Map<string, number> = new Map();

export function normalizeHandle(raw: string): string {
  return raw.replace(/^@/, "").trim().toLowerCase();
}

const HANDLE_RE = /^[a-z0-9_]{1,15}$/;
export function validHandle(h: string): boolean {
  return HANDLE_RE.test(h);
}

export async function submitScore(handle: string, score: number): Promise<{ ok: boolean; rank?: number; best: number; }> {
  const r = getRedis();
  if (!Number.isFinite(score) || score < 0 || score > 1_000_000) {
    return { ok: false, best: 0 };
  }

  if (r) {
    // Only update if new score is higher (GT flag)
    await r.zadd(ZKEY, { gt: true }, { score, member: handle });
    await r.hset(HKEY, { [handle]: Date.now() });
    const best = (await r.zscore(ZKEY, handle)) as number | null;
    // Rank: how many entries strictly higher
    const higher = await r.zcount(ZKEY, (best ?? 0) + 0.0001, "+inf");
    return { ok: true, best: best ?? score, rank: higher + 1 };
  }

  // In-memory
  const prev = memScores.get(handle) ?? 0;
  if (score > prev) {
    memScores.set(handle, score);
    memTs.set(handle, Date.now());
  }
  const best = memScores.get(handle)!;
  // Rank
  let rank = 1;
  for (const v of memScores.values()) if (v > best) rank++;
  return { ok: true, best, rank };
}

export async function getTop(n = 20): Promise<LeaderEntry[]> {
  const r = getRedis();
  if (r) {
    const raw = await r.zrange(ZKEY, 0, n - 1, { rev: true, withScores: true }) as (string | number)[];
    const tsMap = (await r.hgetall(HKEY)) as Record<string, string> | null;
    const out: LeaderEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const handle = String(raw[i]);
      const score = Number(raw[i + 1]);
      const ts = tsMap?.[handle] ? Number(tsMap[handle]) : Date.now();
      out.push({ handle, score, ts });
    }
    return out;
  }
  // In-memory fallback
  const arr: LeaderEntry[] = Array.from(memScores.entries()).map(([handle, score]) => ({
    handle, score, ts: memTs.get(handle) ?? Date.now(),
  }));
  arr.sort((a, b) => b.score - a.score);
  return arr.slice(0, n);
}

export async function getRank(handle: string): Promise<{ best: number; rank: number | null }> {
  const r = getRedis();
  if (r) {
    const best = (await r.zscore(ZKEY, handle)) as number | null;
    if (best == null) return { best: 0, rank: null };
    const higher = await r.zcount(ZKEY, best + 0.0001, "+inf");
    return { best, rank: higher + 1 };
  }
  const best = memScores.get(handle) ?? 0;
  if (best === 0) return { best: 0, rank: null };
  let rank = 1;
  for (const v of memScores.values()) if (v > best) rank++;
  return { best, rank };
}
