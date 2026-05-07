import { NextRequest, NextResponse } from "next/server";
import { submitScore, getTop, normalizeHandle, validHandle, isGlobalEnabled } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const top = await getTop(20);
    return NextResponse.json({
      ok: true,
      mode: isGlobalEnabled() ? "global" : "ephemeral",
      entries: top,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, mode: "error", entries: [], error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawHandle = typeof body.handle === "string" ? body.handle : "";
    const score = Number(body.score);
    const handle = normalizeHandle(rawHandle);

    if (!validHandle(handle)) {
      return NextResponse.json({ ok: false, error: "invalid handle" }, { status: 400 });
    }
    if (!Number.isFinite(score) || score < 0) {
      return NextResponse.json({ ok: false, error: "invalid score" }, { status: 400 });
    }

    const result = await submitScore(handle, Math.floor(score));
    return NextResponse.json({
      ok: result.ok,
      rank: result.rank ?? null,
      best: result.best,
      mode: isGlobalEnabled() ? "global" : "ephemeral",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
