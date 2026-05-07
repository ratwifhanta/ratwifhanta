"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sfx, unlockAudio, startMusic, stopMusic, setMuted, isMuted } from "@/lib/audio";
import Leaderboard from "@/components/Leaderboard";

type Phase = "handle" | "title" | "howtoplay" | "playing" | "gameover";

interface Vec { x: number; y: number; }

interface Human {
  x: number; y: number;
  vx: number; vy: number;
  infected: boolean;
  panicLevel: number;
  wanderTimer: number;
  size: number;
  color: string;
  shirt: string;
  type: "civilian" | "kid" | "scientist";
  worth: number;
  walkPhase: number;
  spreadTimer: number;
  spreadRadius: number;
  spreadPulsePhase: number;
}

type EnemyType = "hazmat" | "cop" | "heli" | "boss";
interface Enemy {
  x: number; y: number;
  vx: number; vy: number;
  type: EnemyType;
  spawnedAt: number;
  size: number;
  speed: number;
  health: number;
  ignoresWalls: boolean;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; max: number;
  color: string;
  size: number;
  kind: "spark" | "trail" | "star" | "ripple";
}

interface ScorePopup {
  x: number; y: number; vy: number;
  life: number; max: number;
  text: string;
  color: string;
  size: number;
}

interface Building {
  x: number; y: number; w: number; h: number;
  color: string;
  roofColor: string;
}

type PowerUpType = "speed" | "sneeze" | "magnet" | "invincible";
interface PowerUp {
  x: number; y: number;
  type: PowerUpType;
  bobPhase: number;
  spawnedAt: number;
}

interface ActiveBuff {
  type: PowerUpType;
  expiresAt: number;
}

const WORLD_W = 2400;
const WORLD_H = 1800;
const RAT_SPEED = 220;
const HUMAN_SPEED = 50;
const RAT_SIZE = 38;
const HUMAN_SIZE = 28;
const INFECT_RADIUS = 38;
const COMBO_WINDOW = 1500;

const WAVE_DURATION = 30000;
const POWERUP_LIFETIME = 14000;
const POWERUP_SPAWN_INTERVAL_MIN = 9000;
const POWERUP_SPAWN_INTERVAL_MAX = 16000;
const SNEEZE_COOLDOWN = 2700;

interface EnemyConfig {
  size: number;
  baseSpeed: number;
  health: number;
  ignoresWalls: boolean;
  color: string;
}
const ENEMY_CONFIG: Record<EnemyType, EnemyConfig> = {
  hazmat:  { size: 30, baseSpeed: 175, health: 1, ignoresWalls: false, color: "#F1C40F" },
  cop:     { size: 28, baseSpeed: 235, health: 1, ignoresWalls: false, color: "#1E40AF" },
  heli:    { size: 36, baseSpeed: 160, health: 1, ignoresWalls: true,  color: "#16A34A" },
  boss:    { size: 46, baseSpeed: 145, health: 3, ignoresWalls: false, color: "#DC2626" },
};

const POWERUP_COLORS: Record<PowerUpType, string> = {
  speed:      "#22D3EE",
  sneeze:     "#F08A3C",
  magnet:     "#D8488A",
  invincible: "#FBBF24",
};
const POWERUP_LABELS: Record<PowerUpType, string> = {
  speed:      "SPEED",
  sneeze:     "BURST",
  magnet:     "MAGNET",
  invincible: "INVINC",
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("handle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [muteState, setMuteState] = useState(false);
  const [handleInput, setHandleInput] = useState("");
  const [savedHandle, setSavedHandle] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ rank: number | null; best: number; mode: string } | null>(null);
  const [lbRefresh, setLbRefresh] = useState(0);
  const [waveNumber, setWaveNumber] = useState(1);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);
  const [endStats, setEndStats] = useState({ infected: 0, longestCombo: 0, waves: 0 });

  const phaseRef = useRef<Phase>("handle");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastInfectRef = useRef(0);
  const ratRef = useRef<Vec & { facing: number }>({ x: WORLD_W / 2, y: WORLD_H / 2, facing: 0 });
  const humansRef = useRef<Human[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activeBuffsRef = useRef<ActiveBuff[]>([]);
  const cameraRef = useRef<Vec>({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const joyRef = useRef<{ active: boolean; x: number; y: number; cx: number; cy: number }>({
    active: false, x: 0, y: 0, cx: 0, cy: 0,
  });
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const screenShakeRef = useRef(0);
  const screenFlashRef = useRef<{ color: string; alpha: number }>({ color: "#fff", alpha: 0 });
  const alertCooldownRef = useRef(0);
  const waveStartedAtRef = useRef(0);
  const waveNumRef = useRef(1);
  const waveAnnounceUntilRef = useRef(0);
  const waveAnnounceTextRef = useRef("");
  const lastPowerSpawnRef = useRef(0);
  const nextPowerSpawnDelayRef = useRef(POWERUP_SPAWN_INTERVAL_MIN);
  const sneezeBurstRef = useRef<{ until: number; angle: number } | null>(null);
  const endGameRef = useRef<() => void>(() => {});
  const ratVelRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const ratTargetFacingRef = useRef(0);
  const shakeOffsetRef = useRef({ x: 0, y: 0 });
  const sneezeCooldownStartRef = useRef(-SNEEZE_COOLDOWN);
  const prevSneezeFracRef = useRef(1);
  const firstPowerUpGivenRef = useRef(false);
  const totalInfectedRef = useRef(0);
  const longestComboRef = useRef(0);
  const wavesCompletedRef = useRef(0);

  // Load handle on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = localStorage.getItem("ratwifhanta_handle") || "";
      if (h) {
        setSavedHandle(h);
        setHandleInput(h);
      }
      setMuteState(isMuted());
    }
  }, []);

  // Resize canvas
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // World setup
  const seedWorld = useCallback(() => {
    const buildings: Building[] = [];
    const cols = 6, rows = 5;
    const blockW = WORLD_W / cols;
    const blockH = WORLD_H / rows;
    const streetW = 70;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip center 2×3 blocks — this is the central plaza
        if (c >= 2 && c <= 3 && r >= 1 && r <= 3) continue;
        const bx = c * blockW + streetW;
        const by = r * blockH + streetW;
        const bw = blockW - streetW * 2;
        const bh = blockH - streetW * 2;
        if (Math.random() < 0.4 && bw > 200) {
          const split = Math.random() * 0.4 + 0.3;
          buildings.push(makeBuilding(bx, by, bw * split - 10, bh, c, r));
          buildings.push(makeBuilding(bx + bw * split + 10, by, bw * (1 - split) - 10, bh, c, r));
        } else if (Math.random() < 0.4 && bh > 200) {
          const split = Math.random() * 0.4 + 0.3;
          buildings.push(makeBuilding(bx, by, bw, bh * split - 10, c, r));
          buildings.push(makeBuilding(bx, by + bh * split + 10, bw, bh * (1 - split) - 10, c, r));
        } else {
          buildings.push(makeBuilding(bx, by, bw, bh, c, r));
        }
      }
    }
    // Chokepoint buildings — narrow passages between plaza and outer zones
    buildings.push(makeBuilding(WORLD_W / 2 + 160, 0, 120, 280, 3, 0));
    buildings.push(makeBuilding(WORLD_W / 2 - 280, 0, 120, 280, 2, 0));
    buildings.push(makeBuilding(WORLD_W / 2 - 180, WORLD_H - 260, 140, 200, 2, 4));
    buildings.push(makeBuilding(WORLD_W / 2 + 40, WORLD_H - 260, 140, 200, 3, 4));

    buildingsRef.current = buildings;
    ratRef.current = { x: WORLD_W / 2, y: WORLD_H / 2, facing: 0 };

    const humans: Human[] = [];
    while (humans.length < 28) {
      const inPlaza = Math.random() < 0.60;
      const x = inPlaza ? 800 + Math.random() * 800 : Math.random() * (WORLD_W - 100) + 50;
      const y = inPlaza ? 360 + Math.random() * 1080 : Math.random() * (WORLD_H - 100) + 50;
      if (!collidesAnyBuilding(x, y, HUMAN_SIZE, buildings)) humans.push(makeHuman(x, y));
    }
    humansRef.current = humans;
    enemiesRef.current = [];
    particlesRef.current = [];
    popupsRef.current = [];
    powerUpsRef.current = [];
    activeBuffsRef.current = [];
    setActiveBuffs([]);
  }, []);

  const startGame = useCallback(() => {
    if (!savedHandle) return;
    unlockAudio();
    startMusic();
    sfx.start();
    seedWorld();
    scoreRef.current = 0;
    comboRef.current = 0;
    lastInfectRef.current = 0;
    setScore(0);
    setCombo(0);
    setSubmitResult(null);
    startedAtRef.current = performance.now();
    lastEnemySpawnRef.current = performance.now();
    waveStartedAtRef.current = performance.now();
    waveNumRef.current = 1;
    setWaveNumber(1);
    waveAnnounceTextRef.current = "WAVE 1 · the lab is leaking";
    waveAnnounceUntilRef.current = performance.now() + 2400;
    lastPowerSpawnRef.current = performance.now() + 5000 + Math.random() * 3000;
    nextPowerSpawnDelayRef.current = POWERUP_SPAWN_INTERVAL_MIN;
    screenShakeRef.current = 0;
    shakeOffsetRef.current = { x: 0, y: 0 };
    screenFlashRef.current = { color: "#fff", alpha: 0 };
    sneezeBurstRef.current = null;
    sneezeCooldownStartRef.current = -SNEEZE_COOLDOWN;
    prevSneezeFracRef.current = 1;
    firstPowerUpGivenRef.current = false;
    totalInfectedRef.current = 0;
    longestComboRef.current = 0;
    wavesCompletedRef.current = 0;
    ratVelRef.current = { vx: 0, vy: 0 };
    phaseRef.current = "howtoplay";
    setPhase("howtoplay");
  }, [seedWorld, savedHandle]);

  const submitToLeaderboard = useCallback(async (handle: string, finalScore: number) => {
    if (finalScore <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, score: finalScore }),
      });
      const j = await res.json();
      if (j.ok) {
        setSubmitResult({ rank: j.rank ?? null, best: j.best, mode: j.mode });
        setLbRefresh((k) => k + 1);
      }
    } catch {
      // Silent fail
    } finally {
      setSubmitting(false);
    }
  }, []);

  const endGame = useCallback(() => {
    stopMusic();
    sfx.caught();
    phaseRef.current = "gameover";
    setPhase("gameover");
    screenShakeRef.current = 22;
    screenFlashRef.current = { color: "#DC2626", alpha: 0.5 };
    const finalScore = scoreRef.current;
    setEndStats({
      infected: totalInfectedRef.current,
      longestCombo: longestComboRef.current,
      waves: wavesCompletedRef.current,
    });
    if (savedHandle) submitToLeaderboard(savedHandle, finalScore);
  }, [submitToLeaderboard, savedHandle]);
  endGameRef.current = endGame;

  // Keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === " " && (phaseRef.current === "title" || phaseRef.current === "gameover")) {
        e.preventDefault();
        if (savedHandle) startGame();
      }
      if ((e.key === "r" || e.key === "R") && phaseRef.current === "gameover" && savedHandle) startGame();
    };
    const onUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [startGame, savedHandle]);

  // Touch joystick
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const rect = wrap.getBoundingClientRect();
      joyRef.current = { active: true, x: 0, y: 0, cx: t.clientX - rect.left, cy: t.clientY - rect.top };
    };
    const onMove = (e: TouchEvent) => {
      if (!joyRef.current.active) return;
      const t = e.touches[0];
      const rect = wrap.getBoundingClientRect();
      const dx = t.clientX - rect.left - joyRef.current.cx;
      const dy = t.clientY - rect.top - joyRef.current.cy;
      const mag = Math.hypot(dx, dy);
      const max = 60;
      if (mag > max) { joyRef.current.x = (dx / mag) * max; joyRef.current.y = (dy / mag) * max; }
      else { joyRef.current.x = dx; joyRef.current.y = dy; }
    };
    const onEnd = () => { joyRef.current = { active: false, x: 0, y: 0, cx: 0, cy: 0 }; };
    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: true });
    wrap.addEventListener("touchend", onEnd);
    wrap.addEventListener("touchcancel", onEnd);
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // Sneeze on space (when playing) — gated by cooldown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && phaseRef.current === "playing") {
        e.preventDefault();
        if (performance.now() - sneezeCooldownStartRef.current >= SNEEZE_COOLDOWN) {
          sneezeCooldownStartRef.current = performance.now();
          triggerSneeze();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tick = (t: number) => {
      const dt = lastTimeRef.current ? Math.min(0.05, (t - lastTimeRef.current) / 1000) : 0.016;
      lastTimeRef.current = t;
      if (phaseRef.current === "playing") update(dt, t);
      render(ctx, canvas);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hasBuff(t: PowerUpType): boolean {
    const now = performance.now();
    return activeBuffsRef.current.some((b) => b.type === t && b.expiresAt > now);
  }

  function applyPowerUp(type: PowerUpType): void {
    const now = performance.now();
    const durations: Record<PowerUpType, number> = {
      speed: 5000, sneeze: 0, magnet: 5000, invincible: 4000,
    };
    if (type === "sneeze") {
      // Instant burst infect in a wide cone
      triggerSneeze(true);
    } else {
      activeBuffsRef.current = [
        ...activeBuffsRef.current.filter((b) => b.type !== type),
        { type, expiresAt: now + durations[type] },
      ];
      setActiveBuffs([...activeBuffsRef.current]);
    }
    sfx.combo(3);
    screenFlashRef.current = { color: POWERUP_COLORS[type], alpha: 0.3 };
    // Pickup popup
    popupsRef.current.push({
      x: ratRef.current.x, y: ratRef.current.y - 30, vy: -38,
      life: 0, max: 1.4, text: POWERUP_LABELS[type], color: POWERUP_COLORS[type], size: 22,
    });
  }

  function triggerSneeze(big = false): void {
    const rat = ratRef.current;
    const angle = rat.facing;
    sneezeBurstRef.current = { until: performance.now() + 250, angle };
    sfx.combo(5);
    const radius = big ? 220 : 130;
    const halfCone = big ? Math.PI : Math.PI / 2.2;

    let infected = 0;
    for (const h of humansRef.current) {
      if (h.infected) continue;
      const dx = h.x - rat.x, dy = h.y - rat.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;
      // Always infect if big (whole circle); else require cone alignment
      if (!big) {
        const a = Math.atan2(dy, dx);
        let diff = Math.abs(angleDiff(a, angle));
        if (diff > halfCone) continue;
      }
      infectHuman(h);
      infected++;
    }
    // Heavy spark burst
    for (let i = 0; i < 30; i++) {
      const a = angle + (Math.random() - 0.5) * (big ? Math.PI * 2 : halfCone * 1.4);
      const sp = 80 + Math.random() * 180;
      particlesRef.current.push({
        x: rat.x, y: rat.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: 0.5 + Math.random() * 0.4,
        color: i % 2 ? "#D8488A" : "#F08A3C",
        size: 4 + Math.random() * 4, kind: "spark",
      });
    }
    if (infected > 0) screenShakeRef.current = Math.max(screenShakeRef.current, 8);
  }

  function infectHuman(h: Human): void {
    const now = performance.now();
    h.infected = true;
    h.spreadTimer = 3.5;
    totalInfectedRef.current += 1;
    const sinceLast = now - lastInfectRef.current;
    if (sinceLast < COMBO_WINDOW) {
      comboRef.current += 1;
      sfx.combo(Math.min(comboRef.current, 6));
    } else {
      comboRef.current = 1;
      sfx.infect();
    }
    longestComboRef.current = Math.max(longestComboRef.current, comboRef.current);
    setCombo(comboRef.current);
    lastInfectRef.current = now;
    const basePoints = 10 * h.worth;
    const points = basePoints * Math.max(1, comboRef.current);
    scoreRef.current += points;
    setScore(scoreRef.current);
    // Ripple particle on infection
    particlesRef.current.push({
      x: h.x, y: h.y, vx: 0, vy: 0,
      life: 0, max: 0.6, color: "#78DC28", size: 8, kind: "ripple",
    });

    // Score popup
    popupsRef.current.push({
      x: h.x, y: h.y - 16, vy: -45,
      life: 0, max: 0.95,
      text: "+" + points, color: comboRef.current >= 3 ? "#F08A3C" : "#D8488A",
      size: comboRef.current >= 3 ? 22 : 18,
    });

    // Combo flash on chain
    if (comboRef.current >= 3) {
      screenFlashRef.current = { color: "#D8488A", alpha: 0.18 };
      screenShakeRef.current = Math.max(screenShakeRef.current, comboRef.current * 1.2);
    }

    // Particles
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 80;
      particlesRef.current.push({
        x: h.x, y: h.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: 0.5 + Math.random() * 0.4,
        color: Math.random() < 0.5 ? "#D8488A" : "#F08A3C",
        size: 4 + Math.random() * 3, kind: "spark",
      });
    }
  }

  function update(dt: number, now: number): void {
    // Prune expired buffs
    const before = activeBuffsRef.current.length;
    activeBuffsRef.current = activeBuffsRef.current.filter((b) => b.expiresAt > now);
    if (activeBuffsRef.current.length !== before) setActiveBuffs([...activeBuffsRef.current]);

    // Wave system
    const elapsedSinceWave = now - waveStartedAtRef.current;
    if (elapsedSinceWave > WAVE_DURATION) {
      wavesCompletedRef.current = waveNumRef.current;
      waveNumRef.current += 1;
      waveStartedAtRef.current = now;
      const wn = waveNumRef.current;
      setWaveNumber(wn);
      const titles = [
        "the city panics",
        "more units deployed",
        "containment protocol",
        "code red",
        "lockdown active",
        "no escape",
        "spread, spread, spread",
      ];
      waveAnnounceTextRef.current = `WAVE ${wn} · ${titles[(wn - 2) % titles.length]}`;
      waveAnnounceUntilRef.current = now + 2400;
      screenFlashRef.current = { color: "#F08A3C", alpha: 0.35 };
      sfx.start();
    }
    const wave = waveNumRef.current;

    // Input vector
    let ix = 0, iy = 0;
    const k = keysRef.current;
    if (k["w"] || k["arrowup"]) iy -= 1;
    if (k["s"] || k["arrowdown"]) iy += 1;
    if (k["a"] || k["arrowleft"]) ix -= 1;
    if (k["d"] || k["arrowright"]) ix += 1;
    if (joyRef.current.active && (joyRef.current.x !== 0 || joyRef.current.y !== 0)) {
      ix += joyRef.current.x / 60;
      iy += joyRef.current.y / 60;
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    const rat = ratRef.current;
    const buildings = buildingsRef.current;
    const speedMult = hasBuff("speed") ? 1.65 : 1.0;
    const targetVx = ix * RAT_SPEED * speedMult;
    const targetVy = iy * RAT_SPEED * speedMult;
    const lerpFactor = mag > 0.1 ? 12 : 8;
    ratVelRef.current.vx += (targetVx - ratVelRef.current.vx) * Math.min(1, lerpFactor * dt);
    ratVelRef.current.vy += (targetVy - ratVelRef.current.vy) * Math.min(1, lerpFactor * dt);
    const dx = ratVelRef.current.vx * dt;
    const dy = ratVelRef.current.vy * dt;
    if (dx !== 0 && !collidesAnyBuilding(rat.x + dx, rat.y, RAT_SIZE / 2, buildings)) rat.x += dx;
    if (dy !== 0 && !collidesAnyBuilding(rat.x, rat.y + dy, RAT_SIZE / 2, buildings)) rat.y += dy;
    rat.x = Math.max(20, Math.min(WORLD_W - 20, rat.x));
    rat.y = Math.max(20, Math.min(WORLD_H - 20, rat.y));
    if (mag > 0.1) ratTargetFacingRef.current = Math.atan2(iy, ix);
    const angleDelta = angleDiff(ratTargetFacingRef.current, rat.facing);
    rat.facing += angleDelta * Math.min(1, 16 * dt);

    // Trail particles
    if (Math.random() < 0.55) {
      particlesRef.current.push({
        x: rat.x - Math.cos(rat.facing) * 14, y: rat.y - Math.sin(rat.facing) * 14,
        vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
        life: 0, max: 0.5 + Math.random() * 0.4,
        color: hasBuff("invincible") ? "#FBBF24" : Math.random() < 0.5 ? "#D8488A" : "#F08A3C",
        size: 3 + Math.random() * 3, kind: "trail",
      });
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.94; p.vy *= 0.94;
      if (p.life >= p.max) particlesRef.current.splice(i, 1);
    }

    // Update score popups
    for (let i = popupsRef.current.length - 1; i >= 0; i--) {
      const p = popupsRef.current[i];
      p.life += dt;
      p.y += p.vy * dt;
      p.vy *= 0.95;
      if (p.life >= p.max) popupsRef.current.splice(i, 1);
    }

    // Power-up spawning
    if (now - lastPowerSpawnRef.current > nextPowerSpawnDelayRef.current && powerUpsRef.current.length < 3) {
      const types: PowerUpType[] = ["speed", "sneeze", "magnet", "invincible"];
      const type: PowerUpType = !firstPowerUpGivenRef.current
        ? (firstPowerUpGivenRef.current = true, "speed")
        : types[Math.floor(Math.random() * types.length)];
      let attempts = 0;
      while (attempts++ < 20) {
        const x = Math.random() * (WORLD_W - 200) + 100;
        const y = Math.random() * (WORLD_H - 200) + 100;
        if (!collidesAnyBuilding(x, y, 22, buildings) &&
            Math.hypot(x - rat.x, y - rat.y) > 220) {
          powerUpsRef.current.push({ x, y, type, bobPhase: Math.random() * Math.PI * 2, spawnedAt: now });
          break;
        }
      }
      lastPowerSpawnRef.current = now;
      nextPowerSpawnDelayRef.current =
        POWERUP_SPAWN_INTERVAL_MIN + Math.random() * (POWERUP_SPAWN_INTERVAL_MAX - POWERUP_SPAWN_INTERVAL_MIN);
    }
    // Expire old power-ups
    powerUpsRef.current = powerUpsRef.current.filter((p) => now - p.spawnedAt < POWERUP_LIFETIME);

    // Power-up pickups
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const p = powerUpsRef.current[i];
      const ddx = p.x - rat.x, ddy = p.y - rat.y;
      if (ddx * ddx + ddy * ddy < (28 + RAT_SIZE / 2) ** 2) {
        applyPowerUp(p.type);
        powerUpsRef.current.splice(i, 1);
      }
    }

    // Humans
    const humans = humansRef.current;
    const magnetActive = hasBuff("magnet");
    for (const h of humans) {
      if (!h.infected) {
        let panic = false;
        const dxr = h.x - rat.x, dyr = h.y - rat.y;
        const dist2 = dxr * dxr + dyr * dyr;
        if (dist2 < 140 * 140) panic = true;

        if (magnetActive && dist2 < 320 * 320) {
          // Pulled toward rat
          const len = Math.sqrt(dist2) || 1;
          h.vx = -(dxr / len) * HUMAN_SPEED * 1.4;
          h.vy = -(dyr / len) * HUMAN_SPEED * 1.4;
          h.panicLevel = Math.min(1, h.panicLevel + dt * 1.5);
        } else if (panic) {
          h.panicLevel = Math.min(1, h.panicLevel + dt * 2);
          const len = Math.sqrt(dist2) || 1;
          h.vx = (dxr / len) * HUMAN_SPEED * 1.6;
          h.vy = (dyr / len) * HUMAN_SPEED * 1.6;
        } else {
          h.panicLevel = Math.max(0, h.panicLevel - dt * 0.5);
          h.wanderTimer -= dt;
          if (h.wanderTimer <= 0) {
            h.wanderTimer = 1.5 + Math.random() * 2;
            const a = Math.random() * Math.PI * 2;
            h.vx = Math.cos(a) * HUMAN_SPEED;
            h.vy = Math.sin(a) * HUMAN_SPEED;
          }
        }

        const nx = h.x + h.vx * dt, ny = h.y + h.vy * dt;
        if (!collidesAnyBuilding(nx, h.y, HUMAN_SIZE / 2, buildings)) h.x = nx;
        else h.vx = -h.vx * 0.5;
        if (!collidesAnyBuilding(h.x, ny, HUMAN_SIZE / 2, buildings)) h.y = ny;
        else h.vy = -h.vy * 0.5;
        h.x = Math.max(15, Math.min(WORLD_W - 15, h.x));
        h.y = Math.max(15, Math.min(WORLD_H - 15, h.y));

        const ddx = h.x - rat.x, ddy = h.y - rat.y;
        if (ddx * ddx + ddy * ddy < INFECT_RADIUS * INFECT_RADIUS) infectHuman(h);
      } else {
        h.vx *= 0.9; h.vy *= 0.9;
        h.x += Math.sin(now * 0.01 + h.x * 0.01) * 0.3;
      }
      // advance walk cycle
      const spd = Math.hypot(h.vx, h.vy);
      h.walkPhase += dt * spd * 0.08;
    }

    // Chain infection spread — infected humans spread to nearby uninfected
    for (const carrier of humans) {
      if (!carrier.infected) continue;
      carrier.spreadTimer -= dt;
      carrier.spreadPulsePhase += dt * 2.2;
      if (carrier.spreadTimer > 0) continue;
      for (const target of humans) {
        if (target.infected) continue;
        const csdx = target.x - carrier.x;
        const csdy = target.y - carrier.y;
        if (csdx * csdx + csdy * csdy < carrier.spreadRadius * carrier.spreadRadius) {
          infectHuman(target);
          carrier.spreadTimer = 1.2;
          break;
        }
      }
    }

    if (comboRef.current > 0 && now - lastInfectRef.current > COMBO_WINDOW) {
      comboRef.current = 0;
      setCombo(0);
    }

    // Spawn humans up to a wave-scaled cap
    const humanCap = 28 + (wave - 1) * 5;
    if (humans.length < humanCap && Math.random() < 0.012) {
      let attempts = 0;
      while (attempts++ < 10) {
        const inPlaza = Math.random() < 0.60;
        const x = inPlaza ? 800 + Math.random() * 800 : Math.random() * (WORLD_W - 100) + 50;
        const y = inPlaza ? 360 + Math.random() * 1080 : Math.random() * (WORLD_H - 100) + 50;
        if (Math.hypot(x - rat.x, y - rat.y) > 250 && !collidesAnyBuilding(x, y, HUMAN_SIZE, buildings)) {
          humans.push(makeHuman(x, y));
          break;
        }
      }
    }

    // Enemy spawning — scales with wave
    const elapsed = now - startedAtRef.current;
    const baseDesired = 1 + Math.floor(wave / 1.5) + Math.floor(scoreRef.current / 350);
    const maxCount = Math.min(baseDesired, 2 + wave * 2);
    const spawnDelay = Math.max(2200, 16000 - elapsed * 0.32 - wave * 600);
    const enemyGraceEnd = wave === 1 ? 22000 : 4000;
    if (enemiesRef.current.length < maxCount && elapsed > enemyGraceEnd && now - lastEnemySpawnRef.current > spawnDelay) {
      const type = pickEnemyType(wave, scoreRef.current);
      const cfg = ENEMY_CONFIG[type];
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = Math.random() * WORLD_W; y = 30; }
      else if (side === 1) { x = WORLD_W - 30; y = Math.random() * WORLD_H; }
      else if (side === 2) { x = Math.random() * WORLD_W; y = WORLD_H - 30; }
      else { x = 30; y = Math.random() * WORLD_H; }
      const speed = cfg.baseSpeed + (wave - 1) * 8;
      enemiesRef.current.push({
        x, y, vx: 0, vy: 0, type, spawnedAt: now,
        size: cfg.size, speed, health: cfg.health, ignoresWalls: cfg.ignoresWalls,
      });
      lastEnemySpawnRef.current = now;
    }

    // Enemy AI
    const invincible = hasBuff("invincible");
    for (const e of enemiesRef.current) {
      const ex = rat.x - e.x, ey = rat.y - e.y;
      const len = Math.hypot(ex, ey) || 1;
      if (e.type === "cop") {
        // Cop charges in straight lines at full speed
        e.vx = (ex / len) * e.speed;
        e.vy = (ey / len) * e.speed;
      } else if (e.type === "heli") {
        // Helicopter ignores walls and slowly closes in
        e.vx = (ex / len) * e.speed;
        e.vy = (ey / len) * e.speed;
      } else if (e.type === "boss") {
        // Boss is steady, slow, relentless
        e.vx = (ex / len) * e.speed;
        e.vy = (ey / len) * e.speed;
      } else {
        e.vx = (ex / len) * e.speed;
        e.vy = (ey / len) * e.speed;
      }
      const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
      if (e.ignoresWalls) { e.x = nx; e.y = ny; }
      else {
        if (!collidesAnyBuilding(nx, e.y, e.size / 2, buildings)) e.x = nx;
        if (!collidesAnyBuilding(e.x, ny, e.size / 2, buildings)) e.y = ny;
      }

      const cdx = e.x - rat.x, cdy = e.y - rat.y;
      const distSq = cdx * cdx + cdy * cdy;
      const minDist = (e.size / 2 + RAT_SIZE / 2 - 4) ** 2;
      if (distSq < minDist) {
        if (!invincible) { endGameRef.current(); return; }
      }
      if (distSq < 130 * 130 && now > alertCooldownRef.current) {
        sfx.alert();
        alertCooldownRef.current = now + 1500;
      }
    }

    // Sneeze cooldown ready chime
    const curSneezeFrac = Math.min(1, (now - sneezeCooldownStartRef.current) / SNEEZE_COOLDOWN);
    if (prevSneezeFracRef.current < 1 && curSneezeFrac >= 1) sfx.sneezeReady();
    prevSneezeFracRef.current = curSneezeFrac;

    // Camera
    const cam = cameraRef.current;
    const canvas = canvasRef.current!;
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    const targetX = rat.x - cssW / 2;
    const targetY = rat.y - cssH / 2;
    cam.x += (targetX - cam.x) * Math.min(1, dt * 6);
    cam.y += (targetY - cam.y) * Math.min(1, dt * 6);
    cam.x = Math.max(0, Math.min(WORLD_W - cssW, cam.x));
    cam.y = Math.max(0, Math.min(WORLD_H - cssH, cam.y));

    // Screen shake — exponential decay
    if (screenShakeRef.current > 0.5) {
      shakeOffsetRef.current.x = (Math.random() - 0.5) * screenShakeRef.current;
      shakeOffsetRef.current.y = (Math.random() - 0.5) * screenShakeRef.current;
      screenShakeRef.current *= Math.pow(0.04, dt);
    } else {
      shakeOffsetRef.current.x *= 0.82;
      shakeOffsetRef.current.y *= 0.82;
      screenShakeRef.current = 0;
    }
    if (screenFlashRef.current.alpha > 0) screenFlashRef.current.alpha -= dt * 1.4;
  }

  function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (cssW === 0 || cssH === 0) return;

    // Asphalt base
    ctx.fillStyle = "#3A3530";
    ctx.fillRect(0, 0, cssW, cssH);

    const cam = cameraRef.current;
    const shakeX = shakeOffsetRef.current.x;
    const shakeY = shakeOffsetRef.current.y;
    ctx.save();
    ctx.translate(-cam.x + shakeX, -cam.y + shakeY);

    // Street base between buildings
    ctx.fillStyle = "#2E2B26";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Sidewalk areas (lighter strip around buildings)
    const cols = 6, rows = 5;
    const blockW = WORLD_W / cols, blockH = WORLD_H / rows;
    const streetW = 70;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Sidewalk block
        ctx.fillStyle = "#4A4540";
        ctx.fillRect(c * blockW + 2, r * blockH + 2, blockW - 4, blockH - 4);
        // Inner block (asphalt)
        ctx.fillStyle = "#2E2B26";
        ctx.fillRect(c * blockW + streetW - 10, r * blockH + streetW - 10, blockW - streetW * 2 + 20, blockH - streetW * 2 + 20);
      }
    }

    // Center lane markings
    ctx.strokeStyle = "rgba(248,230,120,0.55)";
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 20]);
    for (let r = 1; r < rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * blockH); ctx.lineTo(WORLD_W, r * blockH); ctx.stroke(); }
    for (let c = 1; c < cols; c++) { ctx.beginPath(); ctx.moveTo(c * blockW, 0); ctx.lineTo(c * blockW, WORLD_H); ctx.stroke(); }
    ctx.setLineDash([]);

    // Edge lane markings (solid white)
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Sidewalk edge lines
        const sx = c * blockW + streetW - 12;
        const sy = r * blockH + streetW - 12;
        const ex = c * blockW + blockW - streetW + 12;
        const ey = r * blockH + blockH - streetW + 12;
        ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      }
    }

    // Central plaza — open tiled area
    const plazaX = 2 * blockW, plazaY = 1 * blockH;
    const plazaW = 2 * blockW, plazaH = 3 * blockH;
    ctx.fillStyle = "#524840";
    ctx.fillRect(plazaX, plazaY, plazaW, plazaH);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let px = plazaX; px < plazaX + plazaW; px += 60) {
      ctx.beginPath(); ctx.moveTo(px, plazaY); ctx.lineTo(px, plazaY + plazaH); ctx.stroke();
    }
    for (let py = plazaY; py < plazaY + plazaH; py += 60) {
      ctx.beginPath(); ctx.moveTo(plazaX, py); ctx.lineTo(plazaX + plazaW, py); ctx.stroke();
    }
    // Fountain landmark in exact center
    ctx.beginPath();
    ctx.arc(WORLD_W / 2, WORLD_H / 2, 55, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100,180,220,0.35)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(WORLD_W / 2, WORLD_H / 2, 55, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100,180,220,0.08)";
    ctx.fill();

    for (const b of buildingsRef.current) drawBuilding(ctx, b);

    // Particles (trails behind everything)
    for (const p of particlesRef.current) {
      if (p.kind === "ripple") {
        const progress = p.life / p.max;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + progress * 55, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120,220,40,${(1 - progress) * 0.7})`;
        ctx.lineWidth = 2.5 * (1 - progress);
        ctx.setLineDash([]);
        ctx.stroke();
      } else {
        const a = 1 - p.life / p.max;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Power-ups
    for (const p of powerUpsRef.current) drawPowerUp(ctx, p);

    // Humans
    for (const h of humansRef.current) drawHuman(ctx, h);

    // Enemies
    for (const e of enemiesRef.current) drawEnemy(ctx, e);

    // Sneeze cone visual
    if (sneezeBurstRef.current && sneezeBurstRef.current.until > performance.now()) {
      const burst = sneezeBurstRef.current;
      const remain = (burst.until - performance.now()) / 250;
      const r = ratRef.current;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(burst.angle);
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
      grad.addColorStop(0, `rgba(216,72,138,${0.55 * remain})`);
      grad.addColorStop(1, "rgba(216,72,138,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 130, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.fill();
      ctx.restore();
    }

    // Rat
    drawRat(ctx, ratRef.current.x, ratRef.current.y, ratRef.current.facing,
      hasBuff("invincible"), hasBuff("speed"));

    // Infection radius — solid glow ring (no dashes)
    const magnetActive = hasBuff("magnet");
    ctx.beginPath();
    ctx.arc(ratRef.current.x, ratRef.current.y, INFECT_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = magnetActive ? "rgba(216,72,138,0.55)" : "rgba(216,72,138,0.28)";
    ctx.lineWidth = magnetActive ? 3 : 2;
    ctx.setLineDash([]);
    ctx.stroke();
    // Soft outer glow
    const glowGrad = ctx.createRadialGradient(
      ratRef.current.x, ratRef.current.y, INFECT_RADIUS - 4,
      ratRef.current.x, ratRef.current.y, INFECT_RADIUS + 14
    );
    glowGrad.addColorStop(0, `rgba(216,72,138,${magnetActive ? 0.18 : 0.10})`);
    glowGrad.addColorStop(1, "rgba(216,72,138,0)");
    ctx.beginPath();
    ctx.arc(ratRef.current.x, ratRef.current.y, INFECT_RADIUS + 14, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Sneeze cooldown arc around rat
    const bnowArc = performance.now();
    const cooldownFrac = Math.min(1, (bnowArc - sneezeCooldownStartRef.current) / SNEEZE_COOLDOWN);
    if (cooldownFrac < 1) {
      ctx.beginPath();
      ctx.arc(ratRef.current.x, ratRef.current.y, INFECT_RADIUS + 18,
        -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownFrac);
      ctx.strokeStyle = "rgba(240,138,60,0.75)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    // Magnet aura
    if (magnetActive) {
      ctx.beginPath();
      ctx.arc(ratRef.current.x, ratRef.current.y, 320, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(216, 72, 138, 0.18)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Score popups
    for (const sp of popupsRef.current) {
      const a = 1 - sp.life / sp.max;
      ctx.globalAlpha = a;
      ctx.font = `900 ${sp.size}px 'Permanent Marker', cursive`;
      ctx.textAlign = "center";
      ctx.fillStyle = sp.color;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.strokeText(sp.text, sp.x, sp.y);
      ctx.fillText(sp.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    ctx.restore();

    // Screen flash overlay
    if (screenFlashRef.current.alpha > 0) {
      ctx.fillStyle = screenFlashRef.current.color;
      ctx.globalAlpha = screenFlashRef.current.alpha;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.globalAlpha = 1;
    }

    // ---- HUD ----
    if (phaseRef.current === "playing") {
      const padX = 18, top = 14;
      const bnow = performance.now();

      // Score box — 280×80 with left accent bar
      ctx.fillStyle = "rgba(27,18,8,0.92)";
      roundRect(ctx, padX, top, 280, 80, 16);
      ctx.fill();
      ctx.fillStyle = "#D8488A";
      roundRect(ctx, padX, top, 6, 80, 3);
      ctx.fill();

      ctx.fillStyle = "rgba(240,231,212,0.55)";
      ctx.font = "700 11px 'Nunito', sans-serif";
      ctx.letterSpacing = "0.1em";
      ctx.fillText("INFECTED", padX + 18, top + 18);
      ctx.letterSpacing = "0em";

      ctx.font = "900 44px 'Permanent Marker', cursive";
      ctx.fillStyle = "#F08A3C";
      const scoreStr = String(scoreRef.current);
      ctx.fillText(scoreStr, padX + 18, top + 66);

      // Combo badge inside score box
      if (comboRef.current >= 2) {
        const scoreW = ctx.measureText(scoreStr).width;
        const comboX = padX + 18 + scoreW + 10;
        ctx.fillStyle = "#D8488A";
        roundRect(ctx, comboX, top + 44, 78, 26, 6);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "900 13px 'Permanent Marker', cursive";
        ctx.textAlign = "center";
        ctx.fillText("x" + comboRef.current, comboX + 39, top + 61);
        ctx.textAlign = "left";
      }

      // Wave indicator — top center
      ctx.fillStyle = "rgba(27,18,8,0.85)";
      const wW = 150;
      roundRect(ctx, cssW / 2 - wW / 2, top, wW, 50, 12);
      ctx.fill();
      ctx.fillStyle = "#F0E7D4";
      ctx.font = "700 11px 'Nunito', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WAVE", cssW / 2, top + 16);
      ctx.font = "900 26px 'Permanent Marker', cursive";
      ctx.fillStyle = "#F08A3C";
      ctx.fillText(String(waveNumRef.current), cssW / 2, top + 42);
      ctx.textAlign = "left";

      // Active buffs — progress bars top-right
      const bx = cssW - 18;
      let by = top + 8;
      for (const b of activeBuffsRef.current) {
        const totalDur = b.type === "invincible" ? 4000 : 5000;
        const frac = Math.max(0, (b.expiresAt - bnow) / totalDur);
        const bw = 130, bh = 38;
        ctx.fillStyle = "rgba(27,18,8,0.88)";
        roundRect(ctx, bx - bw, by, bw, bh, 8);
        ctx.fill();
        // Progress bar
        ctx.fillStyle = POWERUP_COLORS[b.type];
        if (frac > 0) {
          roundRect(ctx, bx - bw + 4, by + bh - 10, (bw - 8) * frac, 6, 3);
          ctx.fill();
        }
        ctx.fillStyle = POWERUP_COLORS[b.type];
        ctx.font = "900 13px 'Permanent Marker', cursive";
        ctx.textAlign = "right";
        ctx.fillText(POWERUP_LABELS[b.type], bx - 10, by + 22);
        ctx.textAlign = "left";
        by += bh + 5;
      }

      // Wave announcement
      if (waveAnnounceUntilRef.current > bnow) {
        const left = (waveAnnounceUntilRef.current - bnow) / 2400;
        ctx.globalAlpha = Math.min(1, left * 2);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, cssH / 2 - 60, cssW, 120);
        ctx.fillStyle = "#F0E7D4";
        ctx.font = "900 56px 'Permanent Marker', cursive";
        ctx.textAlign = "center";
        ctx.fillText(waveAnnounceTextRef.current, cssW / 2, cssH / 2 + 18);
        ctx.globalAlpha = 1;
        ctx.textAlign = "left";
      }

      // Sneeze hint — show during wave 1 for first 20s
      if (waveNumRef.current === 1 && bnow - startedAtRef.current < 20000) {
        const hintAlpha = Math.min(1, (20000 - (bnow - startedAtRef.current)) / 3000);
        ctx.globalAlpha = hintAlpha;
        ctx.fillStyle = "rgba(27,18,8,0.7)";
        roundRect(ctx, cssW / 2 - 130, cssH - 62, 260, 42, 10);
        ctx.fill();
        ctx.fillStyle = "#F0E7D4";
        ctx.font = "700 13px 'Nunito', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SPACE to sneeze · infect crowds for chain reactions", cssW / 2, cssH - 37);
        ctx.globalAlpha = 1;
        ctx.textAlign = "left";
      }
    }

    // Joystick visual
    if (joyRef.current.active) {
      const j = joyRef.current;
      ctx.fillStyle = "rgba(27, 18, 8, 0.25)";
      ctx.beginPath();
      ctx.arc(j.cx, j.cy, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(216, 72, 138, 0.7)";
      ctx.beginPath();
      ctx.arc(j.cx + j.x, j.cy + j.y, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const toggleMute = () => {
    const m = !isMuted();
    setMuted(m);
    setMuteState(m);
  };

  const startPlaying = useCallback(() => {
    phaseRef.current = "playing";
    setPhase("playing");
  }, []);

  const submitHandle = () => {
    const h = handleInput.replace(/^@/, "").trim().toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(h)) return;
    localStorage.setItem("ratwifhanta_handle", h);
    setSavedHandle(h);
    phaseRef.current = "title";
    setPhase("title");
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full select-none touch-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {phase === "handle" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1B1208]/90 backdrop-blur-sm px-4">
          <h1 className="font-graffiti text-5xl md:text-7xl text-[#F0E7D4] text-center leading-none">
            who&apos;s spreading?
          </h1>
          <p className="text-[#F0E7D4]/70 mt-4 max-w-md text-center text-sm md:text-base">
            drop your X handle so we can put you on the leaderboard. top scorer gets rewarded in <span className="font-graffiti text-[#F08A3C]">SOL</span>.
          </p>
          <div className="mt-8 w-full max-w-sm">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-graffiti text-2xl text-[#F0E7D4]/60">@</span>
              <input
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value.replace(/^@/, "").replace(/\s/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && submitHandle()}
                maxLength={15}
                placeholder="yourhandle"
                spellCheck={false}
                autoCapitalize="off"
                className="w-full bg-[#F0E7D4]/10 text-[#F0E7D4] font-graffiti text-2xl px-12 py-4 rounded-2xl border-4 border-[#F0E7D4]/20 focus:border-[#D8488A] focus:bg-[#F0E7D4]/15 focus:outline-none transition-colors placeholder:text-[#F0E7D4]/30"
              />
            </div>
            <p className="text-[#F0E7D4]/40 text-xs mt-2 text-center">letters, numbers, underscore · max 15 chars</p>
          </div>
          <button
            onClick={submitHandle}
            disabled={!/^[a-z0-9_]{1,15}$/.test(handleInput.replace(/^@/, "").trim().toLowerCase())}
            className="mt-8 font-graffiti text-3xl md:text-4xl px-12 py-5 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] hover:scale-105 transition-all border-4 border-[#F0E7D4] animate-pulse-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            ▶ Continue
          </button>
        </div>
      )}

      {phase === "howtoplay" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1B1208]/95 backdrop-blur-sm px-4">
          <h2 className="font-graffiti text-4xl md:text-5xl text-[#F0E7D4] text-center">
            how to <span className="text-[#D8488A]">spread</span>
          </h2>

          <div className="mt-8 w-full max-w-lg grid grid-cols-1 gap-3">
            <div className="flex items-center gap-5 bg-[#F0E7D4]/[0.08] rounded-2xl border border-[#F0E7D4]/15 p-4">
              <span className="text-5xl flex-shrink-0">🐀</span>
              <div>
                <p className="font-graffiti text-lg text-[#F08A3C]">move &amp; infect</p>
                <p className="text-[#F0E7D4]/70 text-sm mt-0.5">
                  Brush past humans to infect them — infected people spread the virus to their neighbours. Chain reactions score big.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 bg-[#F0E7D4]/[0.08] rounded-2xl border border-[#F0E7D4]/15 p-4">
              <span className="text-5xl flex-shrink-0">💨</span>
              <div>
                <p className="font-graffiti text-lg text-[#F08A3C]">SPACE to sneeze</p>
                <p className="text-[#F0E7D4]/70 text-sm mt-0.5">
                  Blasts a cone of contagion forward. 2.7 second cooldown — aim before you fire.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 bg-[#F0E7D4]/[0.08] rounded-2xl border border-[#F0E7D4]/15 p-4">
              <span className="text-5xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-graffiti text-lg text-[#F08A3C]">don&apos;t get caught</p>
                <p className="text-[#F0E7D4]/70 text-sm mt-0.5">
                  Hazmat suits, cops, and helicopters close in each wave. Grab glowing pick-ups for speed, bursts, and shields.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startPlaying}
            className="mt-8 font-graffiti text-3xl md:text-4xl px-14 py-5 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] hover:scale-105 transition-all border-4 border-[#F0E7D4] animate-pulse-glow"
          >
            ▶ Let&apos;s go
          </button>
        </div>
      )}

      {phase === "title" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start bg-[#1B1208]/90 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <h1 className="font-graffiti text-5xl md:text-7xl text-[#F0E7D4] text-center leading-none mt-4">
            Rat<span className="text-[#D8488A]">Wif</span>Hanta
          </h1>
          <p className="font-graffiti text-xl md:text-2xl text-[#F08A3C] mt-2">$RAT</p>
          <p className="text-[#F0E7D4]/60 mt-2 text-sm">
            playing as <span className="font-graffiti text-[#F08A3C] text-base">@{savedHandle}</span>{" "}
            <button
              onClick={() => { phaseRef.current = "handle"; setPhase("handle"); }}
              className="underline hover:text-[#F0E7D4]/80 ml-1"
            >change</button>
          </p>

          <button
            onClick={startGame}
            className="mt-6 font-graffiti text-3xl md:text-4xl px-12 py-5 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] hover:scale-105 transition-all border-4 border-[#F0E7D4] animate-pulse-glow"
          >
            ▶ Start
          </button>

          <div className="mt-6 flex flex-col items-center gap-1 text-[#F0E7D4]/70 text-xs md:text-sm">
            <div><span className="font-mono bg-[#F0E7D4]/15 px-2 py-1 rounded">WASD</span> · move &nbsp; <span className="font-mono bg-[#F0E7D4]/15 px-2 py-1 rounded">SPACE</span> · sneeze</div>
            <div className="md:hidden"><span className="font-mono bg-[#F0E7D4]/15 px-2 py-1 rounded">drag</span> · move &nbsp; <span className="font-mono bg-[#F0E7D4]/15 px-2 py-1 rounded">2-finger tap</span> · sneeze</div>
          </div>

          <div className="mt-8 w-full max-w-md">
            <p className="font-graffiti text-xl text-[#F08A3C] text-center mb-2">leaderboard</p>
            <Leaderboard highlightHandle={savedHandle} refreshKey={lbRefresh} />
          </div>
        </div>
      )}

      {phase === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start bg-[#1B1208]/90 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <p className="font-graffiti text-2xl text-[#F08A3C] mt-4">caught.</p>
          <h2 className="font-graffiti text-6xl md:text-8xl text-[#D8488A] mt-1 tabular-nums">
            {score.toLocaleString()}
          </h2>
          <p className="text-[#F0E7D4]/60 text-sm">infections</p>

          {/* Stats row */}
          <div className="mt-6 flex gap-6 text-center">
            <div>
              <p className="font-graffiti text-2xl text-[#F0E7D4]">{endStats.infected}</p>
              <p className="text-[#F0E7D4]/50 text-xs uppercase tracking-widest">humans infected</p>
            </div>
            <div className="border-l border-[#F0E7D4]/20" />
            <div>
              <p className="font-graffiti text-2xl text-[#F0E7D4]">x{endStats.longestCombo}</p>
              <p className="text-[#F0E7D4]/50 text-xs uppercase tracking-widest">best combo</p>
            </div>
            <div className="border-l border-[#F0E7D4]/20" />
            <div>
              <p className="font-graffiti text-2xl text-[#F0E7D4]">{endStats.waves}</p>
              <p className="text-[#F0E7D4]/50 text-xs uppercase tracking-widest">waves survived</p>
            </div>
          </div>

          {submitting && (
            <p className="text-[#F0E7D4]/50 mt-4 text-sm animate-pulse">submitting...</p>
          )}
          {submitResult && submitResult.rank && submitResult.rank <= 3 && (
            <div className="mt-4 px-8 py-3 rounded-2xl border-4 border-[#F08A3C] bg-[#F08A3C]/15 animate-pulse-glow text-center">
              <p className="font-graffiti text-4xl text-[#F08A3C]">
                {submitResult.rank === 1 ? "🥇 #1 ALL TIME" : submitResult.rank === 2 ? "🥈 #2" : "🥉 #3"}
              </p>
            </div>
          )}
          {submitResult && submitResult.rank && submitResult.rank > 3 && (
            <p className="text-[#F0E7D4]/70 mt-4 text-base">
              global rank <span className="font-graffiti text-[#F08A3C] text-xl">#{submitResult.rank}</span>
              {submitResult.best > score && (
                <span className="text-[#F0E7D4]/40 text-sm"> · your best: {submitResult.best.toLocaleString()}</span>
              )}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={startGame}
              className="font-graffiti text-2xl md:text-3xl px-8 py-4 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] hover:scale-105 transition-all border-4 border-[#F0E7D4]"
            >
              ▶ Try Again
            </button>
            <a
              href="/"
              className="font-graffiti text-xl md:text-2xl px-6 py-4 rounded-2xl bg-transparent text-[#F0E7D4] hover:text-[#D8488A] border-4 border-[#F0E7D4]/30 hover:border-[#D8488A] transition-all"
            >
              ← Home
            </a>
          </div>

          <div className="mt-8 w-full max-w-md">
            <p className="font-graffiti text-xl text-[#F08A3C] text-center mb-2">leaderboard</p>
            <Leaderboard highlightHandle={savedHandle} refreshKey={lbRefresh} />
          </div>
        </div>
      )}

      {phase === "playing" && (
        <button
          onClick={toggleMute}
          aria-label={muteState ? "Unmute" : "Mute"}
          className="absolute top-4 right-4 z-20 bg-[#1B1208]/80 text-[#F0E7D4] w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[#D8488A] transition"
        >
          {muteState ? "🔇" : "🔊"}
        </button>
      )}
    </div>
  );
}

// =============== HELPERS ===============

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function makeBuilding(x: number, y: number, w: number, h: number, col = 0, row = 0): Building {
  const zonePalettes: Record<string, Array<[string, string]>> = {
    industrial: [["#7A8898", "#5A6878"], ["#8A9098", "#606878"], ["#6A7888", "#4A5868"]],
    commercial:  [["#C47A5A", "#9A5A3A"], ["#D4896A", "#A46848"], ["#B86A4A", "#8A4A2A"]],
    residential: [["#7A9A6A", "#5A7A4A"], ["#8AAA7A", "#6A8A5A"], ["#90A878", "#607848"]],
    neon:        [["#6A4A8A", "#4A2A6A"], ["#7A5A9A", "#5A3A7A"], ["#5A3A7A", "#3A1A5A"]],
  };
  let zone = "industrial";
  if (col >= 3 && row < 2) zone = "commercial";
  else if (col < 3 && row >= 3) zone = "residential";
  else if (col >= 3 && row >= 3) zone = "neon";
  const zp = zonePalettes[zone];
  const p = zp[Math.floor(Math.random() * zp.length)];
  return { x, y, w, h, color: p[0], roofColor: p[1] };
}

function makeHuman(x: number, y: number): Human {
  const colors = ["#3B82F6", "#EF4444", "#A855F7", "#10B981", "#F59E0B", "#06B6D4"];
  const r = Math.random();
  let type: Human["type"] = "civilian";
  let worth = 1;
  if (r < 0.18) { type = "kid"; worth = 2; }
  else if (r < 0.28) { type = "scientist"; worth = 3; }
  return {
    x, y,
    vx: (Math.random() - 0.5) * HUMAN_SPEED,
    vy: (Math.random() - 0.5) * HUMAN_SPEED,
    infected: false,
    panicLevel: 0,
    wanderTimer: Math.random() * 2,
    size: HUMAN_SIZE,
    color: colors[Math.floor(Math.random() * colors.length)],
    shirt: colors[Math.floor(Math.random() * colors.length)],
    type, worth,
    walkPhase: Math.random() * Math.PI * 2,
    spreadTimer: 0,
    spreadRadius: 60,
    spreadPulsePhase: Math.random() * Math.PI * 2,
  };
}

function pickEnemyType(wave: number, score: number): EnemyType {
  // Boss appearance gated on score
  if (score > 1500 && wave >= 3 && Math.random() < 0.10) return "boss";
  if (wave >= 2 && Math.random() < 0.25) return "cop";
  if (wave >= 3 && Math.random() < 0.22) return "heli";
  return "hazmat";
}

function collidesAnyBuilding(x: number, y: number, r: number, blds: Building[]): boolean {
  for (const b of blds) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ==== Sprites ====
function drawBuilding(ctx: CanvasRenderingContext2D, b: Building): void {
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(b.x + 5, b.y + 7, b.w, b.h);
  ctx.fillStyle = b.color;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = b.roofColor;
  ctx.fillRect(b.x, b.y, b.w, 14);
  ctx.fillStyle = "rgba(255, 240, 180, 0.6)";
  const winSize = 12, gap = 22;
  for (let yy = b.y + 26; yy < b.y + b.h - 16; yy += gap) {
    for (let xx = b.x + 14; xx < b.x + b.w - winSize; xx += gap) {
      ctx.fillRect(xx, yy, winSize, winSize);
    }
  }
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
}

function drawRat(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, facing: number,
  invincible: boolean, speedy: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const t = performance.now();

  if (invincible) {
    ctx.save();
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 42);
    grad.addColorStop(0, "rgba(251,191,36,0.65)");
    grad.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (speedy) {
    ctx.strokeStyle = "rgba(34,211,238,0.9)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const o = -28 - i * 7;
      ctx.beginPath();
      ctx.moveTo(o, -10 + i * 5);
      ctx.lineTo(o - 14, -10 + i * 5);
      ctx.stroke();
    }
  }

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(3, 6, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // TAIL — animated wiggle
  const wiggle = Math.sin(t * 0.005) * 6;
  ctx.strokeStyle = "#8E7355";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.bezierCurveTo(-30, 4 + wiggle, -38, -8 + wiggle, -44, 2);
  ctx.stroke();
  // tail tip
  ctx.strokeStyle = "#C8A07A";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-44, 2);
  ctx.bezierCurveTo(-50, 4, -54, 0, -52, -4);
  ctx.stroke();

  // BODY
  ctx.fillStyle = "#BCA07A";
  ctx.beginPath();
  ctx.ellipse(0, 1, 20, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#D4B88A";
  ctx.beginPath();
  ctx.ellipse(-2, -1, 18, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // HIND LEGS
  ctx.fillStyle = "#BCA07A";
  ctx.beginPath();
  ctx.ellipse(-10, 10, 7, 5, 0.4, 0, Math.PI * 2);
  ctx.ellipse(0, 12, 6, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // HEAD
  ctx.fillStyle = "#D4B88A";
  ctx.beginPath();
  ctx.arc(14, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // EAR LEFT
  ctx.fillStyle = "#C09870";
  ctx.beginPath();
  ctx.ellipse(10, -10, 5.5, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E8B0A0";
  ctx.beginPath();
  ctx.ellipse(10, -10, 3, 4.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // EAR RIGHT
  ctx.fillStyle = "#C09870";
  ctx.beginPath();
  ctx.ellipse(18, -10, 5.5, 7, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E8B0A0";
  ctx.beginPath();
  ctx.ellipse(18, -10, 3, 4.5, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // SNOUT
  ctx.fillStyle = "#C09870";
  ctx.beginPath();
  ctx.ellipse(24, 2, 7, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // NOSE
  ctx.fillStyle = "#E890A0";
  ctx.beginPath();
  ctx.arc(28, 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // WHISKERS
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  [-2, 0, 2].forEach((oy) => {
    ctx.beginPath(); ctx.moveTo(24, oy); ctx.lineTo(38, oy - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, oy); ctx.lineTo(38, oy + 2); ctx.stroke();
  });

  // EYES
  ctx.fillStyle = "#1B1208";
  ctx.beginPath();
  ctx.arc(15, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(16, -5, 1, 0, Math.PI * 2);
  ctx.fill();

  // HANTA VIRUS HAT — spiky particle on head
  ctx.save();
  ctx.translate(10, -8);
  ctx.rotate(Math.sin(t * 0.003) * 0.15);
  // crown
  ctx.fillStyle = "#D8488A";
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  // spikes
  ctx.fillStyle = "#F08A3C";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sx = Math.cos(a) * 11;
    const sy = Math.sin(a) * 11;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawHuman(ctx: CanvasRenderingContext2D, h: Human): void {
  ctx.save();
  ctx.translate(h.x, h.y);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 13, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chain infection aura
  if (h.infected) {
    if (h.spreadTimer <= 0) {
      const pulse = 0.5 + 0.5 * Math.sin(h.spreadPulsePhase);
      ctx.beginPath();
      ctx.arc(0, 0, 60 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80,220,60,${0.25 + pulse * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.stroke();
    } else {
      const warmupFrac = 1 - (h.spreadTimer / 3.5);
      ctx.beginPath();
      ctx.arc(0, 0, 30 + warmupFrac * 20, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,255,80,${warmupFrac * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();
    }
    // Infection mist below feet
    const mistGrad = ctx.createRadialGradient(0, 4, 2, 0, 4, 22);
    mistGrad.addColorStop(0, "rgba(80,220,40,0.28)");
    mistGrad.addColorStop(1, "rgba(80,220,40,0)");
    ctx.beginPath();
    ctx.arc(0, 4, 22, 0, Math.PI * 2);
    ctx.fillStyle = mistGrad;
    ctx.fill();
  }

  if (h.infected) {
    // Infected: green sickly look with stagger
    const sway = Math.sin(h.walkPhase * 0.5) * 3;

    // Legs (staggering)
    ctx.strokeStyle = "#5A9A2A";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, 3);
    ctx.lineTo(-5 + sway, 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 3);
    ctx.lineTo(5 - sway, 13);
    ctx.stroke();

    // Body
    ctx.fillStyle = "#6AAA28";
    ctx.fillRect(-5, -5, 10, 10);

    // Arms flailing
    ctx.strokeStyle = "#5A9A2A";
    ctx.lineWidth = 3;
    const armSway = Math.sin(h.walkPhase) * 25;
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    const ang1 = (-Math.PI * 0.5) + armSway * 0.04;
    ctx.lineTo(-5 + Math.cos(ang1) * 10, -3 + Math.sin(ang1) * 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -3);
    const ang2 = (-Math.PI * 0.5) - armSway * 0.04;
    ctx.lineTo(5 + Math.cos(ang2) * 10, -3 + Math.sin(ang2) * 10);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#8AD040";
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();
    // Sick X eyes
    ctx.strokeStyle = "#1B1208";
    ctx.lineWidth = 1.8;
    [[-3, -13], [3, -13]].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(ex - 1.5, ey - 1.5); ctx.lineTo(ex + 1.5, ey + 1.5);
      ctx.moveTo(ex + 1.5, ey - 1.5); ctx.lineTo(ex - 1.5, ey + 1.5);
      ctx.stroke();
    });
    // Green drip
    ctx.fillStyle = "#A0E050";
    ctx.beginPath();
    ctx.ellipse(0, -6, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // virus dots orbiting
    const orbitT = performance.now() * 0.003;
    ctx.fillStyle = "rgba(120,220,40,0.7)";
    for (let i = 0; i < 3; i++) {
      const a = orbitT + i * (Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 13, -11 + Math.sin(a) * 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Walking legs
    const legSwing = Math.sin(h.walkPhase) * 6;
    const s = h.type === "kid" ? 0.75 : 1;

    ctx.strokeStyle = h.type === "scientist" ? "#888" : "#3D2A18";
    ctx.lineWidth = 3.5 * s;
    ctx.lineCap = "round";
    // Left leg
    ctx.beginPath();
    ctx.moveTo(-3 * s, 4 * s);
    ctx.lineTo(-3 * s + legSwing * 0.5, 13 * s);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(3 * s, 4 * s);
    ctx.lineTo(3 * s - legSwing * 0.5, 13 * s);
    ctx.stroke();

    // Feet
    ctx.fillStyle = "#1B1208";
    ctx.beginPath();
    ctx.ellipse(-3 * s + legSwing * 0.5, 14 * s, 3.5 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(3 * s - legSwing * 0.5, 14 * s, 3.5 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    if (h.type === "scientist") {
      // White lab coat body
      ctx.fillStyle = "#F0F0F0";
      ctx.fillRect(-7, -8, 14, 14);
      // Coat lapels
      ctx.strokeStyle = "#CCC";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(0, 4);
      ctx.stroke();
      // Arms
      ctx.strokeStyle = "#E0E0E0";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      const armSwing = Math.sin(h.walkPhase) * 0.3;
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.lineTo(-12 + Math.cos(-Math.PI * 0.4 + armSwing) * 8, -5 + Math.sin(-Math.PI * 0.4 + armSwing) * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7, -5);
      ctx.lineTo(12 + Math.cos(-Math.PI * 0.6 - armSwing) * 8, -5 + Math.sin(-Math.PI * 0.6 - armSwing) * 8);
      ctx.stroke();
      // Head
      ctx.fillStyle = "#FBD8B4";
      ctx.beginPath();
      ctx.arc(0, -16, 7, 0, Math.PI * 2);
      ctx.fill();
      // Glasses
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-3, -16, 2.2, 0, Math.PI * 2);
      ctx.arc(3, -16, 2.2, 0, Math.PI * 2);
      ctx.moveTo(-0.8, -16); ctx.lineTo(0.8, -16);
      ctx.stroke();
      // Hair
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.arc(0, -22, 4, 0, Math.PI, true);
      ctx.fill();
    } else if (h.type === "kid") {
      // Bright shirt
      ctx.fillStyle = h.color;
      ctx.fillRect(-5, -7, 10, 12);
      // Arms
      ctx.strokeStyle = h.shirt;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      const armSwing = Math.sin(h.walkPhase) * 0.35;
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(-9 + Math.cos(-Math.PI * 0.5 + armSwing) * 7, -5 + Math.sin(-Math.PI * 0.5 + armSwing) * 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -5);
      ctx.lineTo(9 + Math.cos(-Math.PI * 0.5 - armSwing) * 7, -5 + Math.sin(-Math.PI * 0.5 - armSwing) * 7);
      ctx.stroke();
      // Head (slightly bigger for kid)
      ctx.fillStyle = "#FBD8B4";
      ctx.beginPath();
      ctx.arc(0, -15, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#1B1208";
      ctx.beginPath();
      ctx.arc(-2, -16, 1, 0, Math.PI * 2);
      ctx.arc(2, -16, 1, 0, Math.PI * 2);
      ctx.fill();
      if (h.panicLevel > 0.3) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-2, -16, 0.5, 0, Math.PI * 2);
        ctx.arc(2, -16, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", 0, -24);
        ctx.textAlign = "left";
      }
      // Hair sprout
      ctx.fillStyle = "#3D2A18";
      ctx.beginPath();
      ctx.arc(0, -21, 3, 0, Math.PI, true);
      ctx.fill();
    } else {
      // Civilian
      ctx.fillStyle = h.shirt;
      ctx.fillRect(-7, -8, 14, 14);
      // Belt line
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-7, 2, 14, 2);
      // Pants
      ctx.fillStyle = h.color;
      ctx.fillRect(-6, 4, 5, 6);
      ctx.fillRect(1, 4, 5, 6);
      // Arms
      ctx.strokeStyle = h.shirt;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      const armSwing = Math.sin(h.walkPhase) * 0.4;
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.lineTo(-12 + Math.cos(-Math.PI * 0.5 + armSwing) * 9, -5 + Math.sin(-Math.PI * 0.5 + armSwing) * 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7, -5);
      ctx.lineTo(12 + Math.cos(-Math.PI * 0.5 - armSwing) * 9, -5 + Math.sin(-Math.PI * 0.5 - armSwing) * 9);
      ctx.stroke();
      // Head
      ctx.fillStyle = "#FBD8B4";
      ctx.beginPath();
      ctx.arc(0, -17, 7.5, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#1B1208";
      if (h.panicLevel > 0.4) {
        ctx.beginPath();
        ctx.arc(-3, -18, 2, 0, Math.PI * 2);
        ctx.arc(3, -18, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-3, -18, 0.9, 0, Math.PI * 2);
        ctx.arc(3, -18, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", 0, -27);
        ctx.textAlign = "left";
      } else {
        ctx.beginPath();
        ctx.arc(-3, -18, 1.2, 0, Math.PI * 2);
        ctx.arc(3, -18, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Hair
      ctx.fillStyle = "#3D2A18";
      ctx.beginPath();
      ctx.arc(0, -23, 5, 0, Math.PI, true);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  ctx.save();
  ctx.translate(e.x, e.y);

  // Heli has a flying shadow
  if (e.type === "heli") {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(8, 18, e.size * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 11, e.size * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (e.type === "hazmat") {
    drawHazmat(ctx, e);
  } else if (e.type === "cop") {
    drawCop(ctx, e);
  } else if (e.type === "heli") {
    drawHeli(ctx, e);
  } else if (e.type === "boss") {
    drawBoss(ctx, e);
  }

  // Siren above (red flashing dot)
  if (e.type === "cop" || e.type === "boss") {
    const blink = Math.floor(performance.now() / 180) % 2 === 0;
    ctx.fillStyle = blink ? "#EF4444" : "#3B82F6";
    ctx.beginPath();
    ctx.arc(0, -e.size * 0.7, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHazmat(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const t = performance.now();
  // Walk bob
  const bob = Math.sin(t * 0.006) * 2;

  // LEGS
  ctx.strokeStyle = "#E0B500";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const legSwing = Math.sin(t * 0.006) * 5;
  ctx.beginPath();
  ctx.moveTo(-4, 8 + bob); ctx.lineTo(-6 + legSwing, 18 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 8 + bob); ctx.lineTo(6 - legSwing, 18 + bob);
  ctx.stroke();

  // BODY SUIT
  ctx.fillStyle = "#F1C40F";
  ctx.beginPath();
  ctx.ellipse(0, 2 + bob, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Suit seam / stripe
  ctx.strokeStyle = "#C9A800";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8 + bob); ctx.lineTo(0, 8 + bob);
  ctx.stroke();
  // Hazmat stripes
  ctx.strokeStyle = "#FF6600";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-11, 0 + bob); ctx.lineTo(11, 0 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, 5 + bob); ctx.lineTo(10, 5 + bob);
  ctx.stroke();

  // ARMS
  ctx.strokeStyle = "#F1C40F";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const armSwing = Math.sin(t * 0.006) * 0.35;
  ctx.beginPath();
  ctx.moveTo(-11, -3 + bob);
  ctx.lineTo(-18 + Math.cos(-Math.PI * 0.5 + armSwing) * 9, -3 + bob + Math.sin(-Math.PI * 0.5 + armSwing) * 9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, -3 + bob);
  ctx.lineTo(18 + Math.cos(-Math.PI * 0.5 - armSwing) * 9, -3 + bob + Math.sin(-Math.PI * 0.5 - armSwing) * 9);
  ctx.stroke();

  // HELMET
  ctx.fillStyle = "#F1C40F";
  ctx.beginPath();
  ctx.arc(0, -11 + bob, 11, 0, Math.PI * 2);
  ctx.fill();

  // VISOR
  ctx.fillStyle = "rgba(150,210,240,0.88)";
  ctx.beginPath();
  ctx.ellipse(0, -11 + bob, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#C9A800";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -11 + bob, 7, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Visor reflection
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(-2, -13 + bob, 2.5, 1.5, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // BREATHING FILTER (chin piece)
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.ellipse(0, -5 + bob, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#AAA";
  ctx.beginPath();
  ctx.arc(-3, -5 + bob, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -5 + bob, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCop(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const t = performance.now();
  const bob = Math.sin(t * 0.009) * 2;

  // LEGS — fast stride (cop runs faster)
  ctx.strokeStyle = "#162F80";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const legSwing = Math.sin(t * 0.009) * 7;
  ctx.beginPath();
  ctx.moveTo(-4, 8 + bob); ctx.lineTo(-5 + legSwing, 18 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 8 + bob); ctx.lineTo(5 - legSwing, 18 + bob);
  ctx.stroke();

  // UNIFORM BODY
  ctx.fillStyle = "#1E40AF";
  ctx.fillRect(-10, -8 + bob, 20, 18);
  // Badge
  ctx.fillStyle = "#FBBF24";
  ctx.beginPath();
  ctx.arc(-4, -2 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#B8860B";
  ctx.font = "bold 4px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★", -4, -1 + bob);
  ctx.textAlign = "left";
  // Belt
  ctx.fillStyle = "#0A1855";
  ctx.fillRect(-10, 6 + bob, 20, 3);

  // ARMS
  ctx.strokeStyle = "#1E40AF";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  const armSwing = Math.sin(t * 0.009) * 0.4;
  ctx.beginPath();
  ctx.moveTo(-10, -4 + bob);
  ctx.lineTo(-17 + Math.cos(-Math.PI * 0.5 + armSwing) * 9, -4 + bob + Math.sin(-Math.PI * 0.5 + armSwing) * 9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, -4 + bob);
  ctx.lineTo(17 + Math.cos(-Math.PI * 0.5 - armSwing) * 9, -4 + bob + Math.sin(-Math.PI * 0.5 - armSwing) * 9);
  ctx.stroke();

  // HEAD
  ctx.fillStyle = "#FBD8B4";
  ctx.beginPath();
  ctx.arc(0, -16 + bob, 8, 0, Math.PI * 2);
  ctx.fill();

  // Eyes — angry expression
  ctx.fillStyle = "#1B1208";
  ctx.beginPath();
  ctx.arc(-3, -17 + bob, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -17 + bob, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Angry brows
  ctx.strokeStyle = "#1B1208";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-5, -20 + bob); ctx.lineTo(-1, -19 + bob);
  ctx.moveTo(1, -19 + bob); ctx.lineTo(5, -20 + bob);
  ctx.stroke();

  // COP HAT
  ctx.fillStyle = "#1E40AF";
  ctx.beginPath();
  ctx.ellipse(0, -22 + bob, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#162F80";
  ctx.fillRect(-7, -28 + bob, 14, 8);
  ctx.fillStyle = "#1E40AF";
  ctx.fillRect(-6, -29 + bob, 12, 8);
  // Hat badge
  ctx.fillStyle = "#FBBF24";
  ctx.beginPath();
  ctx.arc(0, -25 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeli(ctx: CanvasRenderingContext2D, e: Enemy): void {
  // Body
  ctx.fillStyle = "#16A34A";
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail
  ctx.fillStyle = "#16A34A";
  ctx.fillRect(-22, -2, 12, 4);
  ctx.fillRect(-24, -5, 4, 8);
  // Cockpit glass
  ctx.fillStyle = "rgba(180, 220, 240, 0.85)";
  ctx.beginPath();
  ctx.ellipse(5, -1, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spinning rotor
  const spin = (performance.now() / 30) % 360;
  ctx.save();
  ctx.rotate((spin * Math.PI) / 180);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-26, -1.5, 52, 3);
  ctx.fillRect(-1.5, -26, 3, 52);
  ctx.restore();
  // Outline
  ctx.strokeStyle = "#1B1208";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBoss(ctx: CanvasRenderingContext2D, e: Enemy): void {
  // Big red hazmat
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.ellipse(0, 4, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Black belt
  ctx.fillStyle = "#1B1208";
  ctx.fillRect(-15, 6, 30, 4);
  // Helmet
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(0, -12, 12, 0, Math.PI * 2);
  ctx.fill();
  // Visor
  ctx.fillStyle = "rgba(180, 220, 240, 0.8)";
  ctx.beginPath();
  ctx.arc(0, -12, 8, 0, Math.PI * 2);
  ctx.fill();
  // Glowing eyes
  ctx.fillStyle = "#FBBF24";
  ctx.beginPath();
  ctx.arc(-3, -12, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -12, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Antenna
  ctx.strokeStyle = "#1B1208";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -23);
  ctx.lineTo(0, -30);
  ctx.stroke();
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.arc(0, -32, 2, 0, Math.PI * 2);
  ctx.fill();
  // Body outline
  ctx.strokeStyle = "#1B1208";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 4, 16, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp): void {
  const t = (performance.now() / 1000 + p.bobPhase);
  const yOff = Math.sin(t * 3) * 5;
  ctx.save();
  ctx.translate(p.x, p.y + yOff);

  // Pulsing halo
  const pulse = 0.6 + 0.4 * Math.sin(t * 4);
  const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 32);
  grad.addColorStop(0, POWERUP_COLORS[p.type] + "B0");
  grad.addColorStop(1, POWERUP_COLORS[p.type] + "00");
  ctx.globalAlpha = pulse;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Diamond shape
  ctx.fillStyle = POWERUP_COLORS[p.type];
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(14, 0);
  ctx.lineTo(0, 16);
  ctx.lineTo(-14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1B1208";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Icon glyph
  ctx.fillStyle = "#1B1208";
  ctx.font = "900 14px 'Permanent Marker', cursive";
  ctx.textAlign = "center";
  let glyph = "?";
  if (p.type === "speed") glyph = "⚡";
  else if (p.type === "sneeze") glyph = "💥";
  else if (p.type === "magnet") glyph = "🧲";
  else if (p.type === "invincible") glyph = "★";
  ctx.fillText(glyph, 0, 5);
  ctx.textAlign = "left";

  ctx.restore();
}
