"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  Suspense,
  useCallback,
} from "react";
import * as THREE from "three";

// ============================================================
// CONSTANTS
// ============================================================
const MAP_HALF = 40;
const RAT_SPEED_BASE = 9;
const RAT_TURN_SPEED = 12;

const HUMAN_COUNT = 35;
const HUMAN_SPEED = 2.2;

const COP_BASE_SPEED = 5.5;
const COP_BASE_RADIUS = 1.0;
const ESCALATE_INTERVAL = 25; // seconds — ratchet up every N seconds
const MAX_DIFFICULTY = 8; // cap so it doesn't get impossible

// 3 rat archetypes — meaningful trade-offs
type RatStats = { name: string; speedMult: number; aura: number; bodyColor: string };
const RAT_STATS: RatStats[] = [
  { name: "The OG", speedMult: 1.0, aura: 2.0, bodyColor: "#a89380" },
  { name: "Sewer Sneak", speedMult: 1.35, aura: 1.4, bodyColor: "#7a8898" },
  { name: "Lab Chonk", speedMult: 0.78, aura: 3.0, bodyColor: "#dcc8a8" },
];

// ============================================================
// RAT MODEL
// ============================================================
function RatModel({
  ratRef,
  stats,
}: {
  ratRef: React.MutableRefObject<THREE.Group | null>;
  stats: RatStats;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  const t = useRef(0);
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    t.current += dt;
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t.current * 14) * 0.04;
    }
    if (auraRef.current) {
      const m = auraRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + 0.15 * Math.sin(t.current * 4);
    }
  });

  const hatSpikes = useMemo(() => {
    const arr: Array<[number, number, number]> = [];
    for (let i = 0; i < 12; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 12);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.42;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(theta) * Math.sin(phi);
      if (y > -0.1) arr.push([x, y, z]);
    }
    return arr;
  }, []);

  return (
    <group ref={ratRef}>
      <group ref={bodyRef}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.55, 1.3]} />
          <meshStandardMaterial color={stats.bodyColor} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.78, 0.12, 1.25]} />
          <meshStandardMaterial color="#e8d5c0" />
        </mesh>
        <mesh position={[0, 0.7, 0.7]} castShadow>
          <sphereGeometry args={[0.38, 16, 12]} />
          <meshStandardMaterial color={stats.bodyColor} />
        </mesh>
        <mesh position={[0, 0.6, 1.0]} castShadow>
          <boxGeometry args={[0.32, 0.28, 0.25]} />
          <meshStandardMaterial color="#c4a890" />
        </mesh>
        <mesh position={[0, 0.62, 1.13]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshStandardMaterial color="#1a0a0a" />
        </mesh>
        <mesh position={[-0.18, 0.78, 0.95]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[0.18, 0.78, 0.95]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[-0.16, 0.81, 1.01]}>
          <sphereGeometry args={[0.025, 6, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.20, 0.81, 1.01]}>
          <sphereGeometry args={[0.025, 6, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.28, 1.0, 0.6]} castShadow>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial color="#c89c92" />
        </mesh>
        <mesh position={[0.28, 1.0, 0.6]} castShadow>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial color="#c89c92" />
        </mesh>
        <mesh position={[-0.28, 1.0, 0.62]} scale={[0.55, 0.55, 0.55]}>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshStandardMaterial color="#f4a8a8" />
        </mesh>
        <mesh position={[0.28, 1.0, 0.62]} scale={[0.55, 0.55, 0.55]}>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshStandardMaterial color="#f4a8a8" />
        </mesh>
        {/* Crocheted virus hat */}
        <mesh position={[0, 1.02, 0.65]} castShadow>
          <sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.05]} />
          <meshStandardMaterial color="#5aa848" roughness={0.85} />
        </mesh>
        {hatSpikes.map((p, i) => (
          <mesh key={i} position={[p[0], p[1] + 1.02, p[2] + 0.65]} castShadow>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial color="#3a8a3a" roughness={0.85} />
          </mesh>
        ))}
        {/* Mask */}
        <mesh position={[0, 0.5, 1.05]}>
          <boxGeometry args={[0.55, 0.35, 0.18]} />
          <meshStandardMaterial color="#f0f8fb" />
        </mesh>
        <mesh position={[-0.32, 0.62, 0.85]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.05, 0.04, 0.4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.32, 0.62, 0.85]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.05, 0.04, 0.4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {([
          [-0.3, 0.45],
          [0.3, 0.45],
          [-0.3, -0.45],
          [0.3, -0.45],
        ] as Array<[number, number]>).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.1, z]} castShadow>
            <boxGeometry args={[0.18, 0.22, 0.22]} />
            <meshStandardMaterial color="#8a7565" />
          </mesh>
        ))}
        <mesh position={[0, 0.4, -0.9]} rotation={[Math.PI / 2.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.04, 1.2, 8]} />
          <meshStandardMaterial color="#c89c92" />
        </mesh>
      </group>

      {/* Aura — sized by stats.aura */}
      <mesh
        ref={auraRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[stats.aura - 0.4, stats.aura, 32]} />
        <meshBasicMaterial color="#78dc28" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[stats.aura, 32]} />
        <meshBasicMaterial color="#78dc28" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// ============================================================
// HUMAN MODEL — stacked-box pedestrian
// ============================================================
const HUMAN_COLORS = [
  "#d84848",
  "#3a7adc",
  "#f4d03c",
  "#8a4abc",
  "#2a8a4a",
  "#ec6a3a",
  "#48b4d8",
  "#a82a8a",
];

const SKIN_COLORS = ["#f4d8b8", "#d8a878", "#b88858", "#8a5832"];

type HumanRefData = {
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facing: number;
  targetFacing: number;
  infected: boolean;
  spreadTimer: number;
  wanderTimer: number;
  wanderDir: { x: number; z: number };
  bobPhase: number;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
};

function HumanInstance({
  data,
  index,
}: {
  data: HumanRefData;
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);

  // Wire up the data refs
  useEffect(() => {
    if (groupRef.current) data.group = groupRef.current;
    if (bodyMatRef.current) data.bodyMat = bodyMatRef.current;
  }, [data]);

  useFrame((_, dt) => {
    data.bobPhase += dt * 8;
    if (legL.current) legL.current.rotation.x = Math.sin(data.bobPhase) * 0.5;
    if (legR.current) legR.current.rotation.x = -Math.sin(data.bobPhase) * 0.5;
  });

  return (
    <group ref={groupRef} key={index}>
      {/* Legs */}
      <mesh ref={legL} position={[-0.15, 0.4, 0]} castShadow>
        <boxGeometry args={[0.22, 0.8, 0.25]} />
        <meshStandardMaterial color={data.pantsColor} />
      </mesh>
      <mesh ref={legR} position={[0.15, 0.4, 0]} castShadow>
        <boxGeometry args={[0.22, 0.8, 0.25]} />
        <meshStandardMaterial color={data.pantsColor} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.35]} />
        <meshStandardMaterial ref={bodyMatRef} color={data.shirtColor} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.36, 1.15, 0]} castShadow>
        <boxGeometry args={[0.16, 0.7, 0.2]} />
        <meshStandardMaterial color={data.shirtColor} />
      </mesh>
      <mesh position={[0.36, 1.15, 0]} castShadow>
        <boxGeometry args={[0.16, 0.7, 0.2]} />
        <meshStandardMaterial color={data.shirtColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color={data.skinColor} />
      </mesh>
      {/* Hair (simple cap) */}
      <mesh position={[0, 2.04, -0.04]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.5]} />
        <meshStandardMaterial color="#3a2820" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 1.82, 0.23]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0.1, 1.82, 0.23]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

// ============================================================
// COP MODEL
// ============================================================
type CopRefData = {
  group: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facing: number;
  speed: number;
  bobPhase: number;
};

function CopInstance({ data, index }: { data: CopRefData; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (groupRef.current) data.group = groupRef.current;
  }, [data]);

  useFrame((_, dt) => {
    data.bobPhase += dt * 12;
    if (legL.current) legL.current.rotation.x = Math.sin(data.bobPhase) * 0.7;
    if (legR.current) legR.current.rotation.x = -Math.sin(data.bobPhase) * 0.7;
  });

  return (
    <group ref={groupRef} key={index}>
      <mesh ref={legL} position={[-0.18, 0.45, 0]} castShadow>
        <boxGeometry args={[0.26, 0.9, 0.3]} />
        <meshStandardMaterial color="#1a2a4a" />
      </mesh>
      <mesh ref={legR} position={[0.18, 0.45, 0]} castShadow>
        <boxGeometry args={[0.26, 0.9, 0.3]} />
        <meshStandardMaterial color="#1a2a4a" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.65, 0.85, 0.4]} />
        <meshStandardMaterial color="#2a4a8a" />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.42]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Badge */}
      <mesh position={[0.18, 1.45, 0.21]}>
        <boxGeometry args={[0.12, 0.14, 0.04]} />
        <meshStandardMaterial color="#f4c83a" />
      </mesh>
      <mesh position={[-0.42, 1.3, 0]} castShadow>
        <boxGeometry args={[0.18, 0.78, 0.22]} />
        <meshStandardMaterial color="#2a4a8a" />
      </mesh>
      <mesh position={[0.42, 1.3, 0]} castShadow>
        <boxGeometry args={[0.18, 0.78, 0.22]} />
        <meshStandardMaterial color="#2a4a8a" />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#f4d8b8" />
      </mesh>
      {/* Police hat — the iconic look */}
      <mesh position={[0, 2.32, 0]} castShadow>
        <boxGeometry args={[0.55, 0.18, 0.55]} />
        <meshStandardMaterial color="#0a1a3a" />
      </mesh>
      <mesh position={[0, 2.42, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
        <meshStandardMaterial color="#0a1a3a" />
      </mesh>
      {/* Hat badge */}
      <mesh position={[0, 2.42, 0.21]}>
        <boxGeometry args={[0.1, 0.1, 0.04]} />
        <meshStandardMaterial color="#f4c83a" />
      </mesh>
      <mesh position={[-0.1, 2.04, 0.26]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0.1, 2.04, 0.26]}>
        <boxGeometry args={[0.07, 0.07, 0.04]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

// ============================================================
// CITY (unchanged from stage 1 except buildings refer to texture helper)
// ============================================================
type Building = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  windowColor: string;
};

function generateCity(): {
  buildings: Building[];
  trees: Array<[number, number]>;
  cars: Array<[number, number, number, string]>;
  obstacles: Array<{ x: number; z: number; r: number }>;
} {
  const buildings: Building[] = [];
  const trees: Array<[number, number]> = [];
  const cars: Array<[number, number, number, string]> = [];
  const obstacles: Array<{ x: number; z: number; r: number }> = [];

  const palette = (x: number, z: number): { c: string; w: string } => {
    if (x < 0 && z < 0) return { c: "#7a8898", w: "#ffe7a0" };
    if (x >= 0 && z < 0) return { c: "#b86a52", w: "#fff2b8" };
    if (x < 0 && z >= 0) return { c: "#7a9a6a", w: "#fff5c0" };
    return { c: "#8a5aaa", w: "#ffd0f0" };
  };

  const blockSize = 14;
  const roadWidth = 6;
  const step = blockSize + roadWidth;
  const start = -MAP_HALF + roadWidth;
  const cols = Math.floor((MAP_HALF * 2 - roadWidth) / step);

  let seed = 42;
  const rand = (): number => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let cx = 0; cx < cols; cx++) {
    for (let cz = 0; cz < cols; cz++) {
      const blockX = start + cx * step + blockSize / 2;
      const blockZ = start + cz * step + blockSize / 2;

      if (Math.abs(blockX) < step / 2 && Math.abs(blockZ) < step / 2) continue;

      const splits = rand() > 0.5 ? 1 : 2;
      const subSize = blockSize / splits;
      for (let sx = 0; sx < splits; sx++) {
        for (let sz = 0; sz < splits; sz++) {
          if (rand() < 0.18) continue;
          const px = blockX - blockSize / 2 + subSize * (sx + 0.5);
          const pz = blockZ - blockSize / 2 + subSize * (sz + 0.5);
          const w = subSize * (0.7 + rand() * 0.25);
          const d = subSize * (0.7 + rand() * 0.25);
          const h = 4 + rand() * 14;
          const pal = palette(px, pz);
          buildings.push({ x: px, z: pz, w, d, h, color: pal.c, windowColor: pal.w });
          obstacles.push({ x: px, z: pz, r: Math.max(w, d) / 2 + 0.3 });
        }
      }

      if (rand() < 0.4) {
        const tx = blockX - blockSize / 2 - 1.5 + rand() * 2;
        const tz = blockZ - blockSize / 2 - 1.5 + rand() * 2;
        trees.push([tx, tz]);
        obstacles.push({ x: tx, z: tz, r: 0.8 });
      }
    }
  }

  const carColors = ["#d84848", "#3a7adc", "#f4d03c", "#6a6a6a", "#2a8a4a"];
  for (let i = 0; i < 18; i++) {
    const onX = rand() > 0.5;
    if (onX) {
      const x = -MAP_HALF + 4 + rand() * (MAP_HALF * 2 - 8);
      const z = (Math.floor(rand() * cols) - cols / 2) * step + roadWidth / 2 + 1.5;
      cars.push([x, z, 0, carColors[Math.floor(rand() * carColors.length)]]);
      obstacles.push({ x, z, r: 1.6 });
    } else {
      const z = -MAP_HALF + 4 + rand() * (MAP_HALF * 2 - 8);
      const x = (Math.floor(rand() * cols) - cols / 2) * step + roadWidth / 2 + 1.5;
      cars.push([x, z, Math.PI / 2, carColors[Math.floor(rand() * carColors.length)]]);
      obstacles.push({ x, z, r: 1.6 });
    }
  }

  // Fountain obstacle
  obstacles.push({ x: 0, z: 0, r: 2.4 });

  return { buildings, trees, cars, obstacles };
}

function makeBuildingTexture(
  baseColor: string,
  windowColor: string,
  seed: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const c = canvas.getContext("2d")!;
  c.fillStyle = baseColor;
  c.fillRect(0, 0, 128, 256);

  const cols = 4;
  const rows = 8;
  const wpx = 16;
  const wpy = 22;
  const xPad = (128 - cols * wpx) / (cols + 1);
  const yPad = (256 - rows * wpy) / (rows + 1);
  let s = seed;
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let r = 0; r < rows; r++) {
    for (let cc = 0; cc < cols; cc++) {
      const x = xPad + cc * (wpx + xPad);
      const y = yPad + r * (wpy + yPad);
      const lit = rand() > 0.25;
      c.fillStyle = lit ? windowColor : "#1a1010";
      c.fillRect(x, y, wpx, wpy);
      if (lit) {
        c.fillStyle = "rgba(255,255,255,0.18)";
        c.fillRect(x, y, wpx, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function BuildingMesh({ b }: { b: Building }) {
  const tex = useMemo(
    () =>
      makeBuildingTexture(
        b.color,
        b.windowColor,
        Math.floor(b.x * 31 + b.z * 17 + b.h * 7) || 1
      ),
    [b.color, b.windowColor, b.x, b.z, b.h]
  );

  useMemo(() => {
    tex.repeat.set(Math.max(1, Math.floor(b.w / 3)), Math.max(1, Math.floor(b.h / 4)));
    tex.needsUpdate = true;
  }, [tex, b.w, b.h]);

  return (
    <group position={[b.x, b.h / 2, b.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
      <mesh position={[0, b.h / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[b.w * 0.3, 0.6, b.d * 0.3]} />
        <meshStandardMaterial color="#3a3030" />
      </mesh>
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
        <meshStandardMaterial color="#5a3a20" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.9, 10, 8]} />
        <meshStandardMaterial color="#3a7a3a" />
      </mesh>
    </group>
  );
}

function Car({ x, z, rotation, color }: { x: number; z: number; rotation: number; color: string }) {
  return (
    <group position={[x, 0.4, z]} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.7, 3.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 0.1]} castShadow>
        <boxGeometry args={[1.4, 0.6, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0.7]}>
        <boxGeometry args={[1.42, 0.5, 0.05]} />
        <meshBasicMaterial color="#3a4a5a" />
      </mesh>
      <mesh position={[0, 0.55, -0.5]}>
        <boxGeometry args={[1.42, 0.5, 0.05]} />
        <meshBasicMaterial color="#3a4a5a" />
      </mesh>
      {([
        [-0.7, -1.1],
        [0.7, -1.1],
        [-0.7, 1.0],
        [0.7, 1.0],
      ] as Array<[number, number]>).map(([wx, wz], i) => (
        <mesh key={i} position={[wx, -0.25, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

function CityScene({ city }: { city: ReturnType<typeof generateCity> }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP_HALF * 2, MAP_HALF * 2]} />
        <meshStandardMaterial color="#3a3530" />
      </mesh>

      {Array.from({ length: 5 }).map((_, i) => {
        const offset = -MAP_HALF + 4 + i * 20;
        return (
          <group key={`road-${i}`}>
            <mesh position={[0, 0.01, offset]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[MAP_HALF * 2, 0.25]} />
              <meshBasicMaterial color="#f4d03c" />
            </mesh>
            <mesh position={[offset, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.25, MAP_HALF * 2]} />
              <meshBasicMaterial color="#f4d03c" />
            </mesh>
          </group>
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[8, 32]} />
        <meshStandardMaterial color="#5a4a3a" />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[2, 2, 0.8, 24]} />
        <meshStandardMaterial color="#8a8a90" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.1, 24]} />
        <meshBasicMaterial color="#5a8aaa" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.4, 0.5, 8]} />
        <meshStandardMaterial color="#7a7a80" />
      </mesh>

      {city.buildings.map((b, i) => (
        <BuildingMesh key={`b-${i}`} b={b} />
      ))}
      {city.trees.map(([x, z], i) => (
        <Tree key={`t-${i}`} x={x} z={z} />
      ))}
      {city.cars.map(([x, z, r, c], i) => (
        <Car key={`c-${i}`} x={x} z={z} rotation={r} color={c} />
      ))}

      {([
        [0, 0, MAP_HALF],
        [0, 0, -MAP_HALF],
        [MAP_HALF, 0, 0],
        [-MAP_HALF, 0, 0],
      ] as Array<[number, number, number]>).map((pos, i) => (
        <mesh
          key={`fence-${i}`}
          position={[pos[0], 1, pos[2]]}
          rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}
        >
          <boxGeometry args={[MAP_HALF * 2, 2, 0.3]} />
          <meshStandardMaterial color="#454545" />
        </mesh>
      ))}
    </>
  );
}

// ============================================================
// HELPERS
// ============================================================
function angleDiff(target: number, current: number): number {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function safeSpawn(
  obstacles: Array<{ x: number; z: number; r: number }>,
  minDistFromCenter: number = 0
): { x: number; z: number } {
  for (let attempt = 0; attempt < 25; attempt++) {
    const x = (Math.random() - 0.5) * (MAP_HALF * 2 - 4);
    const z = (Math.random() - 0.5) * (MAP_HALF * 2 - 4);
    if (Math.hypot(x, z) < minDistFromCenter) continue;
    let ok = true;
    for (const o of obstacles) {
      if (Math.hypot(x - o.x, z - o.z) < o.r + 1.0) {
        ok = false;
        break;
      }
    }
    if (ok) return { x, z };
  }
  return { x: 0, z: 0 };
}

// ============================================================
// GAME LOOP — runs all per-frame logic
// ============================================================
type GameRefs = {
  ratGroup: React.MutableRefObject<THREE.Group | null>;
  inputRef: React.MutableRefObject<{ x: number; z: number }>;
  humans: HumanRefData[];
  cops: CopRefData[];
  obstacles: Array<{ x: number; z: number; r: number }>;
  ratStats: RatStats;
  ratPos: THREE.Vector3;
  ratVel: { vx: number; vz: number };
  ratFacing: { current: number; target: number };
  startTime: number;
  difficultyLevel: number;
  lastEscalateTime: number;
  isOver: boolean;
  onScore: (infected: number, time: number) => void;
  onCaught: () => void;
  onSpawnCop: () => void;
};

function GameController({
  refs,
  uiTickRef,
}: {
  refs: GameRefs;
  uiTickRef: React.MutableRefObject<number>;
}) {
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (refs.isOver) return;

    const rat = refs.ratGroup.current;
    if (!rat) return;

    // ---- RAT MOVEMENT ----
    const ix = refs.inputRef.current.x;
    const iz = refs.inputRef.current.z;
    const mag = Math.hypot(ix, iz);
    const speed = RAT_SPEED_BASE * refs.ratStats.speedMult;
    const targetVx = mag > 0.01 ? (ix / mag) * speed : 0;
    const targetVz = mag > 0.01 ? (iz / mag) * speed : 0;
    const lerp = mag > 0.1 ? 12 : 8;
    refs.ratVel.vx += (targetVx - refs.ratVel.vx) * Math.min(1, lerp * dt);
    refs.ratVel.vz += (targetVz - refs.ratVel.vz) * Math.min(1, lerp * dt);

    // Apply movement with obstacle resolution.
    // Block motion that pushes deeper INTO an obstacle, but always allow motion
    // that increases distance from it — so we never get permanently stuck.
    const moveX = refs.ratVel.vx * dt;
    const moveZ = refs.ratVel.vz * dt;
    const curX = rat.position.x;
    const curZ = rat.position.z;

    let tryX = curX + moveX;
    for (const o of refs.obstacles) {
      const r = o.r + 0.5;
      const newDistSq = (tryX - o.x) ** 2 + (curZ - o.z) ** 2;
      const oldDistSq = (curX - o.x) ** 2 + (curZ - o.z) ** 2;
      if (newDistSq < r * r && newDistSq < oldDistSq) {
        tryX = curX;
        refs.ratVel.vx = 0;
        break;
      }
    }
    let tryZ = curZ + moveZ;
    for (const o of refs.obstacles) {
      const r = o.r + 0.5;
      const newDistSq = (tryX - o.x) ** 2 + (tryZ - o.z) ** 2;
      const oldDistSq = (tryX - o.x) ** 2 + (curZ - o.z) ** 2;
      if (newDistSq < r * r && newDistSq < oldDistSq) {
        tryZ = curZ;
        refs.ratVel.vz = 0;
        break;
      }
    }
    const limit = MAP_HALF - 1;
    rat.position.x = Math.max(-limit, Math.min(limit, tryX));
    rat.position.z = Math.max(-limit, Math.min(limit, tryZ));
    refs.ratPos.copy(rat.position);

    if (mag > 0.1) refs.ratFacing.target = Math.atan2(ix, iz);
    const delta = angleDiff(refs.ratFacing.target, refs.ratFacing.current);
    refs.ratFacing.current += delta * Math.min(1, RAT_TURN_SPEED * dt);
    rat.rotation.y = refs.ratFacing.current;

    // ---- HUMAN AI + INFECTION ----
    const auraSq = refs.ratStats.aura * refs.ratStats.aura;
    let newlyInfected = 0;
    for (const h of refs.humans) {
      if (!h.group) continue;

      // Wander
      h.wanderTimer -= dt;
      if (h.wanderTimer <= 0) {
        h.wanderTimer = 1.5 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        h.wanderDir.x = Math.cos(a);
        h.wanderDir.z = Math.sin(a);
      }

      // If infected, start coughing/wandering harder; if not infected and rat close, flee a bit
      const dxr = h.pos.x - refs.ratPos.x;
      const dzr = h.pos.z - refs.ratPos.z;
      const dr = Math.hypot(dxr, dzr);
      let dirX = h.wanderDir.x;
      let dirZ = h.wanderDir.z;
      if (!h.infected && dr < 4 && dr > 0.001) {
        // panic — flee from rat
        dirX = dxr / dr;
        dirZ = dzr / dr;
      }
      const sp = HUMAN_SPEED * (h.infected ? 0.6 : 1.0);
      let mx = h.pos.x + dirX * sp * dt;
      let mz = h.pos.z + dirZ * sp * dt;

      // Bounce off obstacles (just reflect direction)
      for (const o of refs.obstacles) {
        if (Math.hypot(mx - o.x, mz - o.z) < o.r + 0.5) {
          h.wanderDir.x = -h.wanderDir.x;
          h.wanderDir.z = -h.wanderDir.z;
          mx = h.pos.x;
          mz = h.pos.z;
          break;
        }
      }
      // Map bounds
      if (mx < -MAP_HALF + 1 || mx > MAP_HALF - 1) {
        h.wanderDir.x = -h.wanderDir.x;
        mx = h.pos.x;
      }
      if (mz < -MAP_HALF + 1 || mz > MAP_HALF - 1) {
        h.wanderDir.z = -h.wanderDir.z;
        mz = h.pos.z;
      }

      h.pos.x = mx;
      h.pos.z = mz;
      h.group.position.set(h.pos.x, 0, h.pos.z);

      // Face direction of motion
      if (Math.abs(dirX) + Math.abs(dirZ) > 0.01) {
        h.targetFacing = Math.atan2(dirX, dirZ);
      }
      h.facing += angleDiff(h.targetFacing, h.facing) * Math.min(1, 8 * dt);
      h.group.rotation.y = h.facing;

      // Infection check
      if (!h.infected) {
        const distSq = dxr * dxr + dzr * dzr;
        if (distSq < auraSq) {
          h.infected = true;
          h.spreadTimer = 3.5;
          newlyInfected++;
          // Tint shirt sickly green
          if (h.bodyMat) h.bodyMat.color.set("#5a8a30");
        }
      } else {
        // Chain spread
        h.spreadTimer -= dt;
        if (h.spreadTimer <= 0) {
          for (const other of refs.humans) {
            if (other.infected || !other.group) continue;
            const dxx = other.pos.x - h.pos.x;
            const dzz = other.pos.z - h.pos.z;
            if (dxx * dxx + dzz * dzz < 9) {
              other.infected = true;
              other.spreadTimer = 4;
              newlyInfected++;
              if (other.bodyMat) other.bodyMat.color.set("#5a8a30");
              h.spreadTimer = 1.5;
              break;
            }
          }
        }
      }
    }

    // ---- COP AI ----
    for (const cop of refs.cops) {
      if (!cop.group) continue;
      cop.bobPhase += dt * 12;
      const dx = refs.ratPos.x - cop.pos.x;
      const dz = refs.ratPos.z - cop.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.001) {
        const dirX = dx / d;
        const dirZ = dz / d;
        let mx = cop.pos.x + dirX * cop.speed * dt;
        let mz = cop.pos.z + dirZ * cop.speed * dt;
        // Simple obstacle avoidance — just don't enter
        for (const o of refs.obstacles) {
          if (Math.hypot(mx - o.x, mz - o.z) < o.r + 0.5) {
            // Slide tangent
            const ox = mx - o.x;
            const oz = mz - o.z;
            const dist = Math.hypot(ox, oz) || 1;
            mx = o.x + (ox / dist) * (o.r + 0.5);
            mz = o.z + (oz / dist) * (o.r + 0.5);
          }
        }
        cop.pos.x = mx;
        cop.pos.z = mz;
        cop.group.position.set(mx, 0, mz);
        cop.facing += angleDiff(Math.atan2(dirX, dirZ), cop.facing) * Math.min(1, 8 * dt);
        cop.group.rotation.y = cop.facing;
      }

      // Catch?
      if (d < COP_BASE_RADIUS) {
        refs.isOver = true;
        refs.onCaught();
        return;
      }
    }

    // ---- DIFFICULTY ESCALATION ----
    const elapsed = (performance.now() - refs.startTime) / 1000;
    const targetLevel = Math.min(MAX_DIFFICULTY, Math.floor(elapsed / ESCALATE_INTERVAL) + 1);
    if (targetLevel > refs.difficultyLevel) {
      refs.difficultyLevel = targetLevel;
      refs.onSpawnCop();
    }

    // Cop speed scales with difficulty
    for (const cop of refs.cops) {
      cop.speed = COP_BASE_SPEED + (refs.difficultyLevel - 1) * 0.6;
    }

    // ---- SCORE / UI tick ----
    uiTickRef.current += dt;
    if (uiTickRef.current >= 0.2 || newlyInfected > 0) {
      uiTickRef.current = 0;
      const infected = refs.humans.filter((h) => h.infected).length;
      refs.onScore(infected, elapsed);
    }
  });

  return null;
}

// ============================================================
// CAMERA
// ============================================================
function IsoCamera({ ratRef }: { ratRef: React.MutableRefObject<THREE.Group | null> }) {
  const { camera } = useThree();
  const offset = useMemo(() => new THREE.Vector3(18, 22, 18), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lerpedTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, dt) => {
    const rat = ratRef.current;
    if (!rat) return;
    target.copy(rat.position);
    lerpedTarget.current.lerp(target, Math.min(1, 6 * dt));
    camera.position.copy(lerpedTarget.current).add(offset);
    camera.lookAt(lerpedTarget.current);
  });

  return null;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
type Phase = "title" | "playing" | "gameover";

export default function Game3D(): React.ReactElement {
  const ratRef = useRef<THREE.Group | null>(null);
  const inputRef = useRef({ x: 0, z: 0 });
  const keysRef = useRef<Set<string>>(new Set());

  const [phase, setPhase] = useState<Phase>("title");
  const [selectedRatIdx, setSelectedRatIdx] = useState(0);
  const [hudInfected, setHudInfected] = useState(0);
  const [hudTime, setHudTime] = useState(0);
  const [endStats, setEndStats] = useState({ infected: 0, time: 0, score: 0 });
  const [handle, setHandle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Persisted handle
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ratwifhanta:handle");
      if (saved) setHandle(saved);
    } catch {}
  }, []);

  const city = useMemo(() => generateCity(), []);

  // Game refs (mutable, no re-render)
  const refsRef = useRef<GameRefs | null>(null);

  // Humans + cops state lives in arrays of refs that we recreate per game
  const [humansData, setHumansData] = useState<HumanRefData[]>([]);
  const [copsData, setCopsData] = useState<CopRefData[]>([]);
  const uiTickRef = useRef(0);

  const onScore = useCallback((infected: number, time: number) => {
    setHudInfected(infected);
    setHudTime(time);
  }, []);

  const onCaught = useCallback(() => {
    if (!refsRef.current) return;
    const infected = refsRef.current.humans.filter((h) => h.infected).length;
    const time = (performance.now() - refsRef.current.startTime) / 1000;
    const score = Math.floor(infected * 100 + time * 10);
    setEndStats({ infected, time, score });
    setPhase("gameover");
    setSubmitted(false);
  }, []);

  const spawnCop = useCallback(() => {
    if (!refsRef.current) return;
    const spawn = safeSpawn(refsRef.current.obstacles, 12);
    const cop: CopRefData = {
      group: null as unknown as THREE.Group,
      pos: new THREE.Vector3(spawn.x, 0, spawn.z),
      vel: new THREE.Vector3(),
      facing: 0,
      speed: COP_BASE_SPEED,
      bobPhase: Math.random() * Math.PI,
    };
    refsRef.current.cops.push(cop);
    setCopsData((prev) => [...prev, cop]);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    const stats = RAT_STATS[selectedRatIdx];

    // Spawn humans
    const humans: HumanRefData[] = [];
    for (let i = 0; i < HUMAN_COUNT; i++) {
      const spawn = safeSpawn(city.obstacles, 4);
      humans.push({
        group: null as unknown as THREE.Group,
        bodyMat: null as unknown as THREE.MeshStandardMaterial,
        pos: new THREE.Vector3(spawn.x, 0, spawn.z),
        vel: new THREE.Vector3(),
        facing: Math.random() * Math.PI * 2,
        targetFacing: 0,
        infected: false,
        spreadTimer: 0,
        wanderTimer: Math.random() * 2,
        wanderDir: { x: Math.random() - 0.5, z: Math.random() - 0.5 },
        bobPhase: Math.random() * Math.PI * 2,
        shirtColor: HUMAN_COLORS[Math.floor(Math.random() * HUMAN_COLORS.length)],
        pantsColor: ["#3a3a4a", "#1a1a2a", "#5a4a3a", "#3a3a3a"][Math.floor(Math.random() * 4)],
        skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)],
      });
    }

    // Initial cop spawned far from rat
    const copSpawn = safeSpawn(city.obstacles, 18);
    const firstCop: CopRefData = {
      group: null as unknown as THREE.Group,
      pos: new THREE.Vector3(copSpawn.x, 0, copSpawn.z),
      vel: new THREE.Vector3(),
      facing: 0,
      speed: COP_BASE_SPEED,
      bobPhase: 0,
    };

    refsRef.current = {
      ratGroup: ratRef,
      inputRef,
      humans,
      cops: [firstCop],
      obstacles: city.obstacles,
      ratStats: stats,
      ratPos: new THREE.Vector3(0, 0, 0),
      ratVel: { vx: 0, vz: 0 },
      ratFacing: { current: 0, target: 0 },
      startTime: performance.now(),
      difficultyLevel: 1,
      lastEscalateTime: 0,
      isOver: false,
      onScore,
      onCaught,
      onSpawnCop: spawnCop,
    };

    setHumansData(humans);
    setCopsData([firstCop]);
    setHudInfected(0);
    setHudTime(0);

    // Reset rat position — spawn in plaza but clear of the fountain
    if (ratRef.current) {
      ratRef.current.position.set(0, 0, 6);
      ratRef.current.rotation.y = 0;
    }

    setPhase("playing");
  }, [city.obstacles, selectedRatIdx, onScore, onCaught, spawnCop]);

  // Submit score
  const submitScore = useCallback(async () => {
    if (!handle.trim() || submitted) return;
    setSubmitted(true);
    try {
      window.localStorage.setItem("ratwifhanta:handle", handle.trim());
    } catch {}
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), score: endStats.score }),
      });
    } catch {
      // ignore — leaderboard might not be configured locally
    }
  }, [handle, submitted, endStats.score]);

  // Keyboard input
  useEffect(() => {
    const recompute = (): void => {
      let x = 0;
      let z = 0;
      const k = keysRef.current;
      if (k.has("w") || k.has("arrowup")) z -= 1;
      if (k.has("s") || k.has("arrowdown")) z += 1;
      if (k.has("a") || k.has("arrowleft")) x -= 1;
      if (k.has("d") || k.has("arrowright")) x += 1;
      // Camera sits in the +X+Z corner looking toward origin, so "up the screen"
      // maps to world direction (-X, -Z). Rotate the WASD vector accordingly:
      //   world_x = (x + z) * cos45
      //   world_z = (z - x) * cos45
      const cos45 = Math.SQRT1_2;
      inputRef.current.x = (x + z) * cos45;
      inputRef.current.z = (z - x) * cos45;
    };
    const onDown = (e: KeyboardEvent): void => {
      keysRef.current.add(e.key.toLowerCase());
      recompute();
    };
    const onUp = (e: KeyboardEvent): void => {
      keysRef.current.delete(e.key.toLowerCase());
      recompute();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const stats = RAT_STATS[selectedRatIdx];

  return (
    <div
      className="absolute inset-0 bg-[#1B1208]"
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        camera={{ position: [18, 22, 18], fov: 35 }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <color attach="background" args={["#7ab8d8"]} />
        <fog attach="fog" args={["#9ec8e0", 40, 90]} />

        <ambientLight intensity={0.65} />
        <directionalLight
          position={[20, 30, 15]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
        />
        <hemisphereLight args={["#a8d0e8", "#4a3a30", 0.4]} />

        <Suspense fallback={null}>
          <CityScene city={city} />
          <RatModel ratRef={ratRef} stats={stats} />
          {humansData.map((h, i) => (
            <HumanInstance key={`h-${i}`} data={h} index={i} />
          ))}
          {copsData.map((c, i) => (
            <CopInstance key={`c-${i}`} data={c} index={i} />
          ))}
          <IsoCamera ratRef={ratRef} />
          {refsRef.current && phase === "playing" && (
            <GameController refs={refsRef.current} uiTickRef={uiTickRef} />
          )}
        </Suspense>
      </Canvas>

      {/* HUD overlay (in-game) */}
      {phase === "playing" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-4 pointer-events-none">
          <div className="bg-[#1B1208]/80 backdrop-blur px-5 py-3 rounded-2xl border-2 border-[#F0E7D4]/20">
            <p className="text-[#F0E7D4]/60 text-xs uppercase tracking-wider">infected</p>
            <p className="font-graffiti text-3xl text-[#78dc28]">{hudInfected}</p>
          </div>
          <div className="bg-[#1B1208]/80 backdrop-blur px-5 py-3 rounded-2xl border-2 border-[#F0E7D4]/20">
            <p className="text-[#F0E7D4]/60 text-xs uppercase tracking-wider">time</p>
            <p className="font-graffiti text-3xl text-[#F0E7D4]">{hudTime.toFixed(1)}s</p>
          </div>
          <div className="bg-[#1B1208]/80 backdrop-blur px-5 py-3 rounded-2xl border-2 border-[#F0E7D4]/20">
            <p className="text-[#F0E7D4]/60 text-xs uppercase tracking-wider">wave</p>
            <p className="font-graffiti text-3xl text-[#F08A3C]">
              {refsRef.current?.difficultyLevel ?? 1}
            </p>
          </div>
        </div>
      )}

      {/* Title screen */}
      {phase === "title" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1B1208]/80 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <h1 className="font-graffiti text-5xl md:text-7xl text-[#F0E7D4] text-center">
            spread the <span className="text-[#D8488A]">hanta</span>
          </h1>
          <p className="text-[#F0E7D4]/70 mt-3 text-center max-w-md">
            walk through the city. infect everyone. don&apos;t get caught.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
            {RAT_STATS.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedRatIdx(i)}
                className={`p-4 rounded-2xl border-2 text-left transition ${
                  selectedRatIdx === i
                    ? "border-[#D8488A] bg-[#D8488A]/20"
                    : "border-[#F0E7D4]/20 bg-[#F0E7D4]/[0.05] hover:bg-[#F0E7D4]/[0.10]"
                }`}
              >
                <p className="font-graffiti text-2xl text-[#F0E7D4]">{r.name}</p>
                <p className="text-[#F0E7D4]/70 text-sm mt-1">
                  {i === 0 && "balanced — hat & mask classic"}
                  {i === 1 && "fast, smaller aura"}
                  {i === 2 && "slow, biggest aura"}
                </p>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  <p className="text-[#F08A3C]">
                    speed{" "}
                    {Array.from({ length: 5 }).map((_, k) =>
                      k < Math.round(r.speedMult * 3) ? "●" : "○"
                    )}
                  </p>
                  <p className="text-[#78dc28]">
                    aura{" "}
                    {Array.from({ length: 5 }).map((_, k) =>
                      k < Math.round(r.aura * 1.5) ? "●" : "○"
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.slice(0, 16))}
            placeholder="your handle"
            className="mt-6 px-4 py-3 rounded-xl bg-[#F0E7D4]/[0.08] border-2 border-[#F0E7D4]/20 text-[#F0E7D4] font-graffiti text-xl text-center w-64 focus:outline-none focus:border-[#D8488A]"
            maxLength={16}
          />

          <button
            onClick={startGame}
            disabled={!handle.trim()}
            className="mt-4 font-graffiti text-3xl px-12 py-4 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] hover:scale-105 transition-all border-4 border-[#F0E7D4] disabled:opacity-40 disabled:hover:scale-100"
          >
            ▶ start
          </button>
          <p className="text-[#F0E7D4]/50 text-sm mt-3">
            WASD to move · cops get tougher every {ESCALATE_INTERVAL}s
          </p>
        </div>
      )}

      {/* Game over */}
      {phase === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1B1208]/85 backdrop-blur px-4">
          <p className="font-graffiti text-2xl text-[#D8488A]">caught.</p>
          <p className="font-graffiti text-7xl md:text-8xl text-[#F0E7D4] mt-2">
            {endStats.score.toLocaleString()}
          </p>
          <p className="text-[#F0E7D4]/70 mt-3 font-mono">
            {endStats.infected} infected · {endStats.time.toFixed(1)}s survived
          </p>

          {!submitted ? (
            <button
              onClick={submitScore}
              className="mt-6 font-graffiti text-xl px-8 py-3 rounded-xl bg-[#F08A3C] text-[#1B1208] hover:bg-[#D8488A] hover:text-[#F0E7D4] transition border-2 border-[#F0E7D4]"
            >
              submit to leaderboard
            </button>
          ) : (
            <p className="mt-6 text-[#78dc28] font-graffiti text-lg">submitted ✓</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setPhase("title");
                setHumansData([]);
                setCopsData([]);
              }}
              className="font-graffiti text-2xl px-8 py-3 rounded-2xl bg-[#D8488A] text-[#F0E7D4] hover:bg-[#F08A3C] transition border-4 border-[#F0E7D4]"
            >
              ↻ try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
