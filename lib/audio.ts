// Procedural sound effects + a tiny chiptune background loop using Web Audio API.
// Zero external assets. Lazy init on first user interaction (browser policy).

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicPlaying = false;
let muted = false;

function ensure(): AudioContext {
  if (!ctx) {
    const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
    ctx = new (window.AudioContext || W.webkitAudioContext!)();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.85;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(masterGain);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function unlockAudio(): void {
  ensure();
}

export function setMuted(m: boolean): void {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.85;
}

export function isMuted(): boolean {
  return muted;
}

// ----- SFX -----

function blip(
  freq: number,
  durMs: number,
  type: OscillatorType = "square",
  volume = 0.3,
  glide?: number
): void {
  const c = ensure();
  if (!sfxGain) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (glide !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, glide),
      c.currentTime + durMs / 1000
    );
  }
  g.gain.setValueAtTime(volume, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start();
  osc.stop(c.currentTime + durMs / 1000 + 0.02);
}

export const sfx = {
  infect(): void {
    // High squeak with rapid descending blip — feels rewarding
    blip(880, 80, "square", 0.18, 1320);
    setTimeout(() => blip(660, 60, "triangle", 0.14, 990), 35);
  },
  combo(level: number): void {
    // Rising arp on combos
    const base = 600 + level * 60;
    blip(base, 70, "square", 0.22);
    setTimeout(() => blip(base * 1.25, 70, "square", 0.22), 70);
    setTimeout(() => blip(base * 1.5, 100, "square", 0.22), 140);
  },
  caught(): void {
    // Game over — descending power chord
    blip(220, 240, "sawtooth", 0.4, 80);
    blip(165, 320, "sawtooth", 0.32, 60);
    setTimeout(() => blip(110, 500, "square", 0.3, 40), 100);
  },
  alert(): void {
    // Exterminator close — alarm
    blip(880, 90, "square", 0.18);
    setTimeout(() => blip(660, 90, "square", 0.18), 100);
  },
  start(): void {
    blip(440, 80, "square", 0.2);
    setTimeout(() => blip(660, 80, "square", 0.2), 80);
    setTimeout(() => blip(880, 140, "square", 0.22), 160);
  },
};

// ----- BACKGROUND CHIPTUNE -----
// Simple 8-step bassline + lead loop. Fully procedural, no assets.

const BASS_PATTERN = [55, 0, 82.4, 0, 55, 65.4, 73.4, 0]; // A, _, E, _, A, C, D, _
const LEAD_PATTERN = [
  220, 0, 0, 261.6, 0, 329.6, 0, 261.6,
  220, 246.9, 261.6, 0, 329.6, 0, 246.9, 0,
];

function tone(
  freq: number,
  start: number,
  durSec: number,
  type: OscillatorType,
  volume: number,
  out: AudioNode
): void {
  if (!ctx || freq === 0) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(volume, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + durSec);
  osc.connect(g);
  g.connect(out);
  osc.start(start);
  osc.stop(start + durSec + 0.02);
}

export function startMusic(): void {
  if (musicPlaying) return;
  const c = ensure();
  if (!musicGain) return;
  musicPlaying = true;

  const bpm = 116;
  const stepSec = 60 / bpm / 2; // 16th-note-ish
  let step = 0;
  let nextTime = c.currentTime + 0.05;

  const scheduler = (): void => {
    if (!musicPlaying || !ctx || !musicGain) return;
    while (nextTime < ctx.currentTime + 0.2) {
      const bassNote = BASS_PATTERN[step % BASS_PATTERN.length];
      if (bassNote) tone(bassNote, nextTime, stepSec * 1.6, "triangle", 0.45, musicGain);
      const leadNote = LEAD_PATTERN[step % LEAD_PATTERN.length];
      if (leadNote) tone(leadNote, nextTime, stepSec * 0.95, "square", 0.18, musicGain);
      // hat-ish noise on every off-beat
      if (step % 2 === 1) {
        const dur = 0.04;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.18, nextTime);
        g.gain.exponentialRampToValueAtTime(0.001, nextTime + dur);
        src.connect(g);
        g.connect(musicGain);
        src.start(nextTime);
      }
      nextTime += stepSec;
      step++;
    }
    musicTimer = window.setTimeout(scheduler, 60);
  };
  scheduler();
}

export function stopMusic(): void {
  musicPlaying = false;
  if (musicTimer !== null) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}
