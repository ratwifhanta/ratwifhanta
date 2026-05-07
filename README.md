# RatWifHanta — $RAT

The official site & game for the ratwifhanta memecoin on Solana.

## Stack
- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS 4
- TypeScript
- Upstash Redis (optional, for global leaderboard)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or 3001 if 3000 is taken).

## Deploy to Vercel (free)

1. Push this folder to a new GitHub repo (e.g. `ratwifhanta-site`)
2. Go to https://vercel.com/new → import the repo
3. Vercel auto-detects Next.js — click **Deploy**
4. You get a free URL like `ratwifhanta.vercel.app` — paste in your X bio

### Optional: Custom domain
Buy domain → Vercel project → **Settings → Domains** → add it and follow DNS steps.

---

## Leaderboard — going from per-device to global (2 minutes)

By default the leaderboard runs in **ephemeral** mode — scores are kept in memory on the server and reset when the serverless function cold-starts. That works for testing but is **not durable**, which matters if you're rewarding the top scorer in SOL.

To make it persistent and globally shared:

### Option A — via the Vercel dashboard (easiest, 2 clicks)
1. After deploying, open your project in Vercel
2. Click the **Storage** tab → **Create Database** → **Upstash for Redis** (Marketplace)
3. Pick the free **Hobby** plan, link it to your project
4. Vercel auto-injects `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` as env vars
5. Trigger a redeploy (or push any commit) — leaderboard is now global. Done.

### Option B — Upstash directly (if not using Vercel)
1. Go to https://upstash.com → sign in with GitHub
2. **Create Database** → name it, pick a region close to your users
3. Copy the **REST URL** and **REST Token** from the database overview
4. In your hosting platform, set env vars:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
5. Redeploy. Leaderboard is now global.

The code auto-detects whether env vars are present and switches modes — no code changes needed either way.

---

## Editing token info / branding

| What | Where |
|---|---|
| Replace homepage rat photo with your X PFP | `public/pfp.png` (overwrite this file) |
| X handle (@RatWifHanta) | `app/page.tsx`, `app/layout.tsx` |
| Future: contract address, buy link | add new section in `app/page.tsx` |

---

## Game mechanics

| Control | Action |
|---|---|
| WASD / arrows | move |
| SPACE | sneeze (cone-spread infection) |
| touch & drag | mobile movement |

**Power-ups** (spawn around the city, pick up by walking over them):
- ⚡ **Speed** (5s) — 65% speed boost
- 💥 **Burst** — instant infection of every human in a wide radius
- 🧲 **Magnet** (5s) — humans walk *toward* you
- ★ **Invincible** (4s) — exterminators can't catch you

**Enemies** scale with wave number:
- Yellow hazmat — slow, predictable
- Blue cop (wave 2+) — fast straight-line chase
- Green helicopter (wave 3+) — ignores buildings
- Red boss (score 1500+) — bigger, slower, intimidating

**Waves** — every 30 seconds: more humans spawn, faster enemies, screen flash, dramatic title.

**Combos** — chain infections within 1.5 seconds for stacking score multipliers.

**Score** is auto-submitted to the leaderboard with the player's X handle on game over.
