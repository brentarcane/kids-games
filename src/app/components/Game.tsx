"use client";

import { Environment, Html, useAnimations, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

// ─── Proximity Voice Hook ────────────────────────────────────────────────────

/** Reusable hook: plays an audio file when the rabbit enters a radius,
 *  with a cooldown between triggers and distance-based volume falloff. */
function useProximityVoice(
  src: string,
  opts: { radius: number; cooldown: number },
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef(0);

  /** Call every frame with delta and the squared distance to the rabbit.
   *  Handles triggering, cooldown, and volume. */
  const update = useCallback(
    (delta: number, distSq: number) => {
      if (cooldownRef.current > 0) cooldownRef.current -= delta;

      const radiusSq = opts.radius * opts.radius;

      // Trigger when inside radius and off cooldown
      if (cooldownRef.current <= 0 && distSq < radiusSq) {
        cooldownRef.current = opts.cooldown;
        if (!audioRef.current) {
          audioRef.current = new Audio(src);
        }
        const audio = audioRef.current;
        audio.currentTime = 0;
        audio.volume = 1;
        audio.play().catch(() => { });
      }

      // Adjust volume based on distance while audio is playing
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const dist = Math.sqrt(distSq);
        // Full volume within radius, fades to 0 at 3× radius
        const fadeEnd = opts.radius * 3;
        audio.volume = THREE.MathUtils.clamp(1 - (dist - opts.radius) / (fadeEnd - opts.radius), 0, 1);
      }
    },
    [src, opts.radius, opts.cooldown],
  );

  return update;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HOP_FORCE = 0.32;
const TURN_SPEED = 0.045;
const FORWARD_SPEED = 0.18;
const GRAVITY = -0.015;
const GROUND_Y = 0.5;
const WORLD_RADIUS = 80;
const CARROT_COUNT = 15;
/** Mr. Todd's roaming speed (slow wandering). */
const FOX_ROAM_SPEED = 0.04;
/** How close the fox gets to a waypoint before picking a new one. */
const FOX_WAYPOINT_RADIUS = 3;
/** How far from the centre waypoints can be placed. */
const FOX_ROAM_RANGE = 40;
/** Spawn ahead of Peter (who faces −Z) so the fox is visible at the start. */
const FOX_SPAWN_X = 12;
const FOX_SPAWN_Z = -20;
const FOX_VOICE_RADIUS = 8;
const FOX_VOICE_COOLDOWN = 10;
/** Approximate max height above `GROUND_Y` from current hop physics (per-frame integration). */
const HOP_HEIGHT_HINT = 0.42;
const FENCE_POST_HEIGHT = 1.0;
const FENCE_SECTION_WIDTH = 1.6;

/** Mr. McGregor */
const FARMER_ROAM_SPEED = 0.03;
const FARMER_WAYPOINT_RADIUS = 3;
const FARMER_ROAM_RANGE = 45;
const FARMER_CATCH_RADIUS = 2;
const FARMER_SPAWN_X = -20;
const FARMER_SPAWN_Z = 15;
const FARMER_SCALE = 1.4;

/** Mercat (friendly) */
const MERCAT_ROAM_SPEED = 0.035;
const MERCAT_WAYPOINT_RADIUS = 3;
const MERCAT_ROAM_RANGE = 50;
const MERCAT_TOUCH_RADIUS = 2.5;
const MERCAT_VOICE_RADIUS = 8;
const MERCAT_VOICE_COOLDOWN = 10; // seconds between voice lines
const MERCAT_SPAWN_X = 15;
const MERCAT_SPAWN_Z = 20;
const MERCAT_SCALE = 1;
const SPEED_BOOST_MULTIPLIER = 2.5;
const SPEED_BOOST_DURATION = 3; // seconds

/** Procedural gait when the GLB has no animation clips (rad/s). */
const PROC_WALK_FREQ = 10;
const PROC_WALK_ROLL = 0.07;
const PROC_WALK_PITCH = 0.05;
const PROC_WALK_BOB_Y = 0.04;

// ─── Types ───────────────────────────────────────────────────────────────────

type Carrot = { id: number; x: number; z: number; collected: boolean };

type TreeData = {
  x: number;
  z: number;
  scale: number;
  trunkHeight: number;
  leafRadius: number;
};
type FlowerData = { x: number; z: number; color: string };
type RockData = { x: number; z: number; scale: number };
type GardenData = {
  x: number;
  z: number;
  rotation: number;
  width: number;  // sections along X
  depth: number;  // sections along Z
  chickens: { cx: number; cz: number; facing: number }[];
};

// ─── Deterministic world generation ──────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateWorld() {
  const rng = seededRandom(42);

  const trees: TreeData[] = [];
  for (let i = 0; i < 40; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 12 + rng() * (WORLD_RADIUS - 20);
    trees.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      scale: 0.8 + rng() * 0.8,
      trunkHeight: 2 + rng() * 2,
      leafRadius: 1.5 + rng() * 1.5,
    });
  }

  const flowers: FlowerData[] = [];
  const flowerColors = [
    "#ff69b4",
    "#ff6347",
    "#ffd700",
    "#da70d6",
    "#ff8c00",
    "#87ceeb",
  ];
  for (let i = 0; i < 80; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 3 + rng() * (WORLD_RADIUS - 10);
    flowers.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      color: flowerColors[Math.floor(rng() * flowerColors.length)],
    });
  }

  const rocks: RockData[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 5 + rng() * (WORLD_RADIUS - 15);
    rocks.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      scale: 0.3 + rng() * 0.7,
    });
  }

  const carrots: Carrot[] = [];
  for (let i = 0; i < CARROT_COUNT; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 5 + rng() * 40;
    carrots.push({
      id: i,
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      collected: false,
    });
  }

  const gardens: GardenData[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 12 + rng() * (WORLD_RADIUS - 30);
    const w = 2 + Math.floor(rng() * 2); // 2–3 sections wide
    const d = 2 + Math.floor(rng() * 2); // 2–3 sections deep
    const chickenCount = 1 + Math.floor(rng() * 3); // 1–3 chickens
    const chickens: GardenData["chickens"] = [];
    const halfW = (w * FENCE_SECTION_WIDTH) / 2 - 0.4;
    const halfD = (d * FENCE_SECTION_WIDTH) / 2 - 0.4;
    for (let c = 0; c < chickenCount; c++) {
      chickens.push({
        cx: (rng() - 0.5) * 2 * halfW,
        cz: (rng() - 0.5) * 2 * halfD,
        facing: rng() * Math.PI * 2,
      });
    }
    gardens.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      rotation: rng() * Math.PI * 2,
      width: w,
      depth: d,
      chickens,
    });
  }

  return { trees, flowers, rocks, carrots, gardens };
}

const WORLD = generateWorld();

// ─── Rabbit (GLB model with procedural hop animation) ────────────────────────

const RABBIT_MODEL_PATH = "/peter_rabbit.glb";
// Model is ~0.2 units tall, scale up to ~1.5 units for the game world
const RABBIT_SCALE = 6;

/** GLB forward vs game "forward" differ; π yaw shows the rabbit's back to the follow camera. */
const RABBIT_MODEL_YAW = Math.PI;

const _meshLabelBox = new THREE.Box3();
const _meshLabelCenter = new THREE.Vector3();

function collectMeshes(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  return meshes;
}

/** Labels each rigid mesh with an index (GLB traversal order) + node name for mapping parts. */
function RabbitMeshDebugLabels({ meshes }: { meshes: THREE.Mesh[] }) {
  return (
    <>
      {meshes.map((mesh, index) => (
        <MeshPartLabel key={mesh.uuid} index={index} mesh={mesh} />
      ))}
    </>
  );
}

function MeshPartLabel({ mesh, index }: { mesh: THREE.Mesh; index: number }) {
  const gRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = gRef.current;
    if (!g) return;
    const parent = g.parent;
    if (!parent) return;
    _meshLabelBox.setFromObject(mesh);
    _meshLabelBox.getCenter(_meshLabelCenter);
    parent.worldToLocal(_meshLabelCenter);
    g.position.copy(_meshLabelCenter);
  });

  const name = mesh.name || "—";

  return (
    <group ref={gRef}>
      <Html
        center
        distanceFactor={14}
        occlude={false}
        style={{ pointerEvents: "none" }}
        zIndexRange={[16777271, 0]}
      >
        <div className="flex flex-col items-center gap-0.5 rounded-md bg-black/80 px-2 py-1 text-white shadow-lg ring-1 ring-white/30">
          <span className="text-lg font-bold leading-none tabular-nums">
            {index}
          </span>
          <span
            className="max-w-[7rem] truncate text-center text-[10px] leading-tight text-white/75"
            title={name}
          >
            {name}
          </span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Procedural hop *pose* (lean / squash) layered on top of physics on the parent group.
 * We read parent Y each frame because `hopping` as React state would not update when only refs change.
 */
function RabbitModel({ showMeshLabels, keysRef }: { showMeshLabels: boolean; keysRef: RefObject<{ left: boolean; right: boolean; up: boolean; down: boolean; space: boolean }> }) {
  const { scene, animations: gltfClips } = useGLTF(RABBIT_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const walkProcRef = useRef<THREE.Group>(null);
  const animRootRef = useRef<THREE.Group>(null);
  const prevParentY = useRef<number | null>(null);
  const squash = useRef(0);
  const walkPhase = useRef(0);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const debugMeshes = useMemo(() => collectMeshes(clonedScene), [clonedScene]);
  const hasGltfClips = gltfClips.length > 0;
  const { actions } = useAnimations(gltfClips, animRootRef);

  /** Lift mesh so its lowest point (after scale + yaw) sits at parent y≈0; pivot is often mid-body. */
  const footLiftY = useMemo(() => {
    const holder = new THREE.Group();
    const yawed = new THREE.Group();
    yawed.rotation.y = RABBIT_MODEL_YAW;
    const probe = clonedScene.clone(true);
    probe.scale.setScalar(RABBIT_SCALE);
    yawed.add(probe);
    holder.add(yawed);
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder);
    const epsilon = 0.02;
    return Math.max(0, -box.min.y + epsilon);
  }, [clonedScene]);

  useEffect(() => {
    if (!hasGltfClips) return;
    const clip =
      gltfClips.find((c) => /walk|run|jog|locomot/i.test(c.name)) ??
      gltfClips.find((c) => /idle/i.test(c.name)) ??
      gltfClips[0];
    const action = clip ? actions[clip.name] : undefined;
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    walkActionRef.current = action;
    return () => {
      action.stop();
      walkActionRef.current = null;
    };
  }, [actions, gltfClips, hasGltfClips]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    const parent = g?.parent;
    if (!g || !parent) return;

    const y = parent.position.y;
    const vy =
      prevParentY.current != null && delta > 0
        ? (y - prevParentY.current) / delta
        : 0;
    prevParentY.current = y;

    const airborne = y > GROUND_Y + 0.04;
    squash.current *= 0.88;
    if (!airborne && vy < -0.08) squash.current = 0.12;

    const keys = keysRef.current;
    const moving = keys ? (keys.up || keys.down || keys.left || keys.right) : false;
    const walkAction = walkActionRef.current;
    if (walkAction) {
      walkAction.paused = airborne || !moving;
    }

    const wp = walkProcRef.current;
    if (wp && !hasGltfClips) {
      const a = (airborne || !moving) ? 0 : 1;
      if (a > 0.01) {
        walkPhase.current += delta * PROC_WALK_FREQ;
        const ph = walkPhase.current;
        const roll = Math.sin(ph) * PROC_WALK_ROLL * a;
        const pitch = Math.sin(ph * 2) * PROC_WALK_PITCH * a;
        const bob = Math.abs(Math.sin(ph * 2)) * PROC_WALK_BOB_Y * a;
        wp.rotation.z = THREE.MathUtils.lerp(wp.rotation.z, roll, 0.35);
        wp.rotation.x = THREE.MathUtils.lerp(wp.rotation.x, pitch, 0.35);
        wp.position.y = THREE.MathUtils.lerp(wp.position.y, bob, 0.35);
      } else {
        wp.rotation.z *= 0.85;
        wp.rotation.x *= 0.85;
        wp.position.y *= 0.85;
      }
    }

    if (airborne) {
      const t = THREE.MathUtils.clamp((y - GROUND_Y) / HOP_HEIGHT_HINT, 0, 1);
      const stretch = 1 + Math.sin(t * Math.PI) * 0.06;
      const lean = THREE.MathUtils.clamp(-vy * 0.35, -0.35, 0.45);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, lean, 0.25);
      g.scale.set(1, stretch * (1 - squash.current), 1);
    } else {
      g.rotation.x *= 0.82;
      const sy = 1 - squash.current;
      g.scale.x = THREE.MathUtils.lerp(g.scale.x, 1, 0.2);
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, sy, 0.25);
      g.scale.z = THREE.MathUtils.lerp(g.scale.z, 1, 0.2);
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, footLiftY, 0]}>
        <group ref={walkProcRef}>
          <group ref={animRootRef} rotation={[0, RABBIT_MODEL_YAW, 0]}>
            <primitive object={clonedScene} scale={RABBIT_SCALE} />
            {showMeshLabels ? (
              <RabbitMeshDebugLabels meshes={debugMeshes} />
            ) : null}
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(RABBIT_MODEL_PATH);

// ─── Mr. Todd (fox) ─────────────────────────────────────────────────────────

const FOX_MODEL_PATH = "/fox_animation.glb";
const FOX_SCALE = 1.3;
/** Tune if the GLB’s forward axis doesn’t match `lookAt` after loading. */
const FOX_MODEL_YAW = 0;

function FoxModel({ paused }: { paused: boolean }) {
  const { scene, animations: gltfClips } = useGLTF(FOX_MODEL_PATH);
  const animRootRef = useRef<THREE.Group>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);

  // SkeletonUtils.clone preserves skeleton bindings (scene.clone breaks skinned meshes)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(gltfClips, animRootRef);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const clip =
      gltfClips.find((c) => /walk|run|jog|locomot/i.test(c.name)) ??
      gltfClips.find((c) => /idle/i.test(c.name)) ??
      gltfClips[0];
    const action = clip ? actions[clip.name] : undefined;
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    walkActionRef.current = action;
    return () => {
      action.stop();
      walkActionRef.current = null;
    };
  }, [actions, gltfClips]);

  useFrame(() => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;
  });

  return (
    <group ref={animRootRef} rotation={[0, FOX_MODEL_YAW, 0]}>
      <primitive object={clonedScene} scale={FOX_SCALE} />
    </group>
  );
}

useGLTF.preload(FOX_MODEL_PATH);

function pickWaypoint(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * FOX_ROAM_RANGE;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function MrTodd({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const waypoint = useRef<[number, number]>(pickWaypoint());
  const updateVoice = useProximityVoice("/mr-todd-1.mp3", { radius: FOX_VOICE_RADIUS, cooldown: FOX_VOICE_COOLDOWN });
  const _look = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(FOX_SPAWN_X, 2, FOX_SPAWN_Z);
  }, []);

  useFrame((_, delta) => {
    const fox = groupRef.current;
    if (!fox || paused) return;

    // Play voice line when Peter approaches Mr. Todd
    const rabbit = rabbitRef.current;
    if (rabbit) {
      const vdx = rabbit.position.x - fox.position.x;
      const vdz = rabbit.position.z - fox.position.z;
      updateVoice(delta, vdx * vdx + vdz * vdz);
    }

    let fx = fox.position.x;
    let fz = fox.position.z;
    const [wx, wz] = waypoint.current;

    const dx = wx - fx;
    const dz = wz - fz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Arrived at waypoint — pick a new one
    if (dist < FOX_WAYPOINT_RADIUS) {
      waypoint.current = pickWaypoint();
      return;
    }

    // Move toward waypoint
    fx += (dx / dist) * FOX_ROAM_SPEED;
    fz += (dz / dist) * FOX_ROAM_SPEED;

    fox.position.x = fx;
    fox.position.z = fz;

    // Face movement direction (same Y so the model doesn’t tilt)
    _look.set(wx, fox.position.y, wz);
    fox.lookAt(_look);
  });

  return (
    <group ref={groupRef}>
      <FoxModel paused={paused} />
    </group>
  );
}

// ─── Mr. McGregor (farmer) ───────────────────────────────────────────────────

const FARMER_MODEL_PATH = "/lowpolyfarmerman.glb";

function FarmerModel({ paused }: { paused: boolean }) {
  const { scene, animations: gltfClips } = useGLTF(FARMER_MODEL_PATH);
  const animRootRef = useRef<THREE.Group>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkPhase = useRef(0);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const hasGltfClips = gltfClips.length > 0;
  const { actions } = useAnimations(gltfClips, animRootRef);

  useEffect(() => {
    if (!hasGltfClips) return;
    const clip =
      gltfClips.find((c) => /walk|run|jog|locomot/i.test(c.name)) ??
      gltfClips.find((c) => /idle/i.test(c.name)) ??
      gltfClips[0];
    const action = clip ? actions[clip.name] : undefined;
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    walkActionRef.current = action;
    return () => {
      action.stop();
      walkActionRef.current = null;
    };
  }, [actions, gltfClips, hasGltfClips]);

  useFrame((_, delta) => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;

    const root = animRootRef.current;
    if (root && !hasGltfClips) {
      walkPhase.current += delta * PROC_WALK_FREQ;
      const ph = walkPhase.current;
      root.rotation.z = Math.sin(ph) * PROC_WALK_ROLL;
      root.rotation.x = Math.sin(ph * 2) * PROC_WALK_PITCH;
      root.position.y = Math.abs(Math.sin(ph * 2)) * PROC_WALK_BOB_Y;
    }
  });

  return (
    <group ref={animRootRef}>
      <primitive object={clonedScene} scale={FARMER_SCALE} />
    </group>
  );
}

useGLTF.preload(FARMER_MODEL_PATH);

function pickFarmerWaypoint(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * FARMER_ROAM_RANGE;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function MrMcGregor({
  rabbitRef,
  paused,
  gameOver,
  onCaught,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  gameOver: boolean;
  onCaught: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const waypoint = useRef<[number, number]>(pickFarmerWaypoint());
  const caughtSentRef = useRef(false);
  const _look = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(FARMER_SPAWN_X, GROUND_Y, FARMER_SPAWN_Z);
  }, []);

  useFrame(() => {
    const farmer = groupRef.current;
    const rabbit = rabbitRef.current;
    if (!farmer || !rabbit || paused || gameOver) return;

    // Check collision with Peter
    const rx = rabbit.position.x;
    const rz = rabbit.position.z;
    let fx = farmer.position.x;
    let fz = farmer.position.z;

    const cdx = rx - fx;
    const cdz = rz - fz;
    if (
      !caughtSentRef.current &&
      cdx * cdx + cdz * cdz < FARMER_CATCH_RADIUS * FARMER_CATCH_RADIUS
    ) {
      caughtSentRef.current = true;
      onCaught();
      return;
    }

    // Roam toward waypoint
    const [wx, wz] = waypoint.current;
    const dx = wx - fx;
    const dz = wz - fz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < FARMER_WAYPOINT_RADIUS) {
      waypoint.current = pickFarmerWaypoint();
      return;
    }

    fx += (dx / dist) * FARMER_ROAM_SPEED;
    fz += (dz / dist) * FARMER_ROAM_SPEED;

    farmer.position.x = fx;
    farmer.position.z = fz;

    _look.set(wx, farmer.position.y, wz);
    farmer.lookAt(_look);
  });

  return (
    <group ref={groupRef}>
      <FarmerModel paused={paused || gameOver} />
    </group>
  );
}

// ─── Mercat (friendly cat that gives speed boost) ───────────────────────────

const MERCAT_MODEL_PATH = "/mercat.glb";

function MercatModel({ paused }: { paused: boolean }) {
  const { scene, animations: gltfClips } = useGLTF(MERCAT_MODEL_PATH);
  const animRootRef = useRef<THREE.Group>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkPhase = useRef(0);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const hasGltfClips = gltfClips.length > 0;
  const { actions } = useAnimations(gltfClips, animRootRef);

  useEffect(() => {
    if (!hasGltfClips) return;
    const clip =
      gltfClips.find((c) => /walk|run|jog|locomot/i.test(c.name)) ??
      gltfClips.find((c) => /idle/i.test(c.name)) ??
      gltfClips[0];
    const action = clip ? actions[clip.name] : undefined;
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    walkActionRef.current = action;
    return () => {
      action.stop();
      walkActionRef.current = null;
    };
  }, [actions, gltfClips, hasGltfClips]);

  useFrame((_, delta) => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;

    const root = animRootRef.current;
    if (root && !hasGltfClips) {
      walkPhase.current += delta * PROC_WALK_FREQ;
      const ph = walkPhase.current;
      root.rotation.z = Math.sin(ph) * PROC_WALK_ROLL;
      root.rotation.x = Math.sin(ph * 2) * PROC_WALK_PITCH;
      root.position.y = Math.abs(Math.sin(ph * 2)) * PROC_WALK_BOB_Y;
    }
  });

  return (
    <group ref={animRootRef}>
      <primitive object={clonedScene} scale={MERCAT_SCALE} />
    </group>
  );
}

useGLTF.preload(MERCAT_MODEL_PATH);

function pickMercatWaypoint(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * MERCAT_ROAM_RANGE;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function Mercat({
  rabbitRef,
  paused,
  onBoost,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  onBoost: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const waypoint = useRef<[number, number]>(pickMercatWaypoint());
  const cooldownRef = useRef(0);
  const updateVoice = useProximityVoice("/abigail-1.mp3", { radius: MERCAT_VOICE_RADIUS, cooldown: MERCAT_VOICE_COOLDOWN });
  const _look = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(MERCAT_SPAWN_X, GROUND_Y, MERCAT_SPAWN_Z);
  }, []);

  useFrame((_, delta) => {
    const cat = groupRef.current;
    const rabbit = rabbitRef.current;
    if (!cat || !rabbit || paused) return;

    // Cooldown so boost doesn't fire every frame
    if (cooldownRef.current > 0) cooldownRef.current -= delta;

    // Check touch with Peter
    let mx = cat.position.x;
    let mz = cat.position.z;
    const rx = rabbit.position.x;
    const rz = rabbit.position.z;
    const cdx = rx - mx;
    const cdz = rz - mz;
    if (
      cooldownRef.current <= 0 &&
      cdx * cdx + cdz * cdz < MERCAT_TOUCH_RADIUS * MERCAT_TOUCH_RADIUS
    ) {
      cooldownRef.current = SPEED_BOOST_DURATION + 1;
      onBoost();
    }

    // Play voice line when Peter approaches Mercat
    updateVoice(delta, cdx * cdx + cdz * cdz);

    // Roam toward waypoint
    const [wx, wz] = waypoint.current;
    const dx = wx - mx;
    const dz = wz - mz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < MERCAT_WAYPOINT_RADIUS) {
      waypoint.current = pickMercatWaypoint();
      return;
    }

    mx += (dx / dist) * MERCAT_ROAM_SPEED;
    mz += (dz / dist) * MERCAT_ROAM_SPEED;

    cat.position.x = mx;
    cat.position.z = mz;

    _look.set(wx, cat.position.y, wz);
    cat.lookAt(_look);
  });

  return (
    <group ref={groupRef}>
      <MercatModel paused={paused} />
    </group>
  );
}

// ─── Jeremy Fisher (frog, hidden collectible character) ──────────────────────

const FROG_MODEL_PATH = "/frog.glb";
const FROG_SCALE = 0.12;
const FROG_SPAWN_X = -58;
const FROG_SPAWN_Z = 48;
const FROG_SPEECH_RADIUS = 10;
const FROG_VOICE_RADIUS = 10;
const FROG_VOICE_COOLDOWN = 15;

function JeremyFisher({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(FROG_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [showSpeech, setShowSpeech] = useState(false);
  const updateVoice = useProximityVoice("/jeremy-fisher.mp3", { radius: FROG_VOICE_RADIUS, cooldown: FROG_VOICE_COOLDOWN });

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(FROG_SPAWN_X, GROUND_Y + 1, FROG_SPAWN_Z);
    g.scale.setScalar(FROG_SCALE);
  }, []);

  // Set up animation directly on the cloned scene with its own mixer
  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /idle|sit|croak/i.test(c.name)) ??
      gltfClips[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity).play();
    }
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [gltfClips, clonedScene]);

  useFrame((_, delta) => {
    if (!paused && mixerRef.current) {
      mixerRef.current.update(delta);
    }

    const rabbit = rabbitRef.current;
    const frog = groupRef.current;
    if (!rabbit || !frog) return;
    const dx = rabbit.position.x - frog.position.x;
    const dz = rabbit.position.z - frog.position.z;
    const distSq = dx * dx + dz * dz;
    setShowSpeech(distSq < FROG_SPEECH_RADIUS * FROG_SPEECH_RADIUS);
    updateVoice(delta, distSq);
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {showSpeech && (
        <Html
          center
          position={[0, 20, 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none" }}
          zIndexRange={[16777271, 0]}
        >
          <div className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-lg ring-1 ring-gray-300">
            Oh Peter, I&apos;m so happy to see you.
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Pond ────────────────────────────────────────────────────────────────────

const POND_MODEL_PATH = "/pond.glb";
const POND_SCALE = 0.02;
const POND_X = -55;
const POND_Z = 45;

useGLTF.preload(POND_MODEL_PATH);

function Pond() {
  const { scene } = useGLTF(POND_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(POND_X, GROUND_Y - 1.5, POND_Z);
    g.scale.setScalar(POND_SCALE);
  }, []);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── Quinn Rabbit ────────────────────────────────────────────────────────────

const QUINN_MODEL_PATH = "/quinn_rabbit.glb";
const QUINN_SCALE = 1.0;
const QUINN_VOICE_RADIUS = 10;
const QUINN_VOICE_COOLDOWN = 15;
const QUINN_SPAWN_X = 30;
const QUINN_SPAWN_Z = -35;

useGLTF.preload(QUINN_MODEL_PATH);

function QuinnRabbit({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(QUINN_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [showSpeech, setShowSpeech] = useState(false);
  const updateVoice = useProximityVoice("/quinn-rabbit.mp3", { radius: QUINN_VOICE_RADIUS, cooldown: QUINN_VOICE_COOLDOWN });

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(QUINN_SPAWN_X, GROUND_Y - 0.8, QUINN_SPAWN_Z);
    g.scale.setScalar(QUINN_SCALE);
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /idle|stand/i.test(c.name)) ?? gltfClips[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity).play();
    }
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [gltfClips, clonedScene]);

  useFrame((_, delta) => {
    if (!paused && mixerRef.current) {
      mixerRef.current.update(delta);
    }

    const rabbit = rabbitRef.current;
    const quinn = groupRef.current;
    if (!rabbit || !quinn) return;
    const dx = rabbit.position.x - quinn.position.x;
    const dz = rabbit.position.z - quinn.position.z;
    const distSq = dx * dx + dz * dz;
    setShowSpeech(distSq < QUINN_VOICE_RADIUS * QUINN_VOICE_RADIUS);
    updateVoice(delta, distSq);
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {showSpeech && (
        <Html
          center
          position={[0, 3, 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none" }}
          zIndexRange={[16777271, 0]}
        >
          <div className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-lg ring-1 ring-gray-300">
            Quick Peter, you need to find Jeremy Fisher.
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Tree ────────────────────────────────────────────────────────────────────

function Tree({ data }: { data: TreeData }) {
  return (
    <group position={[data.x, 0, data.z]} scale={data.scale}>
      {/* Trunk */}
      <mesh position={[0, data.trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, data.trunkHeight, 8]} />
        <meshStandardMaterial color="#8B5E3C" />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, data.trunkHeight + data.leafRadius * 0.5, 0]}>
        <sphereGeometry args={[data.leafRadius, 8, 8]} />
        <meshStandardMaterial color="#2d7a2d" />
      </mesh>
      <mesh position={[0.5, data.trunkHeight + data.leafRadius * 0.3, 0.5]}>
        <sphereGeometry args={[data.leafRadius * 0.7, 8, 8]} />
        <meshStandardMaterial color="#3a9a3a" />
      </mesh>
      <mesh position={[-0.4, data.trunkHeight + data.leafRadius * 0.4, -0.3]}>
        <sphereGeometry args={[data.leafRadius * 0.6, 8, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </group>
  );
}

// ─── Flower ──────────────────────────────────────────────────────────────────

function Flower({ data }: { data: FlowerData }) {
  return (
    <group position={[data.x, 0, data.z]}>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      {/* Petals */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={data.color} />
      </mesh>
      {/* Center */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}

// ─── Rock ────────────────────────────────────────────────────────────────────

function Rock({ data }: { data: RockData }) {
  return (
    <mesh position={[data.x, data.scale * 0.3, data.z]} scale={data.scale}>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#888888" flatShading />
    </mesh>
  );
}

// ─── Chicken model ──────────────────────────────────────────────────────────

const CHICKEN_MODEL_PATH = "/chicken.glb";
const CHICKEN_SCALE = 0.6;

function ChickenModel({ facing }: { facing: number }) {
  const { scene } = useGLTF(CHICKEN_MODEL_PATH);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return (
    <group rotation={[0, facing, 0]}>
      <primitive object={cloned} scale={CHICKEN_SCALE} />
    </group>
  );
}

useGLTF.preload(CHICKEN_MODEL_PATH);

// ─── Fenced garden with chickens ────────────────────────────────────────────

function FenceWall({ sections, length }: { sections: number; length: number }) {
  const posts = sections + 1;
  const totalWidth = sections * FENCE_SECTION_WIDTH;
  return (
    <group>
      {Array.from({ length: posts }).map((_, i) => {
        const px = i * FENCE_SECTION_WIDTH - totalWidth / 2;
        return (
          <mesh key={`p-${length}-${px}`} position={[px, FENCE_POST_HEIGHT / 2, 0]}>
            <boxGeometry args={[0.12, FENCE_POST_HEIGHT, 0.12]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        );
      })}
      {Array.from({ length: sections }).map((_, i) => {
        const rx = i * FENCE_SECTION_WIDTH - totalWidth / 2 + FENCE_SECTION_WIDTH / 2;
        return (
          <group key={`r-${length}-${rx}`}>
            <mesh position={[rx, FENCE_POST_HEIGHT * 0.8, 0]}>
              <boxGeometry args={[FENCE_SECTION_WIDTH - 0.1, 0.08, 0.06]} />
              <meshStandardMaterial color="#8B6914" />
            </mesh>
            <mesh position={[rx, FENCE_POST_HEIGHT * 0.35, 0]}>
              <boxGeometry args={[FENCE_SECTION_WIDTH - 0.1, 0.08, 0.06]} />
              <meshStandardMaterial color="#8B6914" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ChickenGarden({ data }: { data: GardenData }) {
  const halfW = (data.width * FENCE_SECTION_WIDTH) / 2;
  const halfD = (data.depth * FENCE_SECTION_WIDTH) / 2;
  return (
    <group position={[data.x, 0, data.z]} rotation={[0, data.rotation, 0]}>
      {/* Front wall (+Z) */}
      <group position={[0, 0, halfD]}>
        <FenceWall sections={data.width} length={0} />
      </group>
      {/* Back wall (-Z) */}
      <group position={[0, 0, -halfD]}>
        <FenceWall sections={data.width} length={1} />
      </group>
      {/* Left wall (-X) */}
      <group position={[-halfW, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <FenceWall sections={data.depth} length={2} />
      </group>
      {/* Right wall (+X) */}
      <group position={[halfW, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <FenceWall sections={data.depth} length={3} />
      </group>
      {/* Chickens */}
      {data.chickens.map((ch, i) => (
        <group key={`ch-${data.x}-${data.z}-${i}`} position={[ch.cx, 0.3, ch.cz]}>
          <ChickenModel facing={ch.facing} />
        </group>
      ))}
    </group>
  );
}

// ─── Carrot (3D) ─────────────────────────────────────────────────────────────

const CARROT_MODEL_PATH = "/carrot.glb";
const CARROT_SCALE = 0.033;

function CarrotItem({ carrot }: { carrot: Carrot }) {
  const { scene } = useGLTF(CARROT_MODEL_PATH);
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.name.startsWith("carrot")) {
          mat.color.set("#FF8C00");
          mat.emissive.set("#FF4500");
          mat.emissiveIntensity = 0.3;
        } else if (mat.name.startsWith("leaf")) {
          mat.color.set("#32CD32");
        }
      }
    });
    return clone;
  }, [scene]);
  const ref = useRef<THREE.Group>(null);
  const collected = useRef(false);

  useFrame((_, delta) => {
    if (!ref.current || collected.current) return;
    ref.current.rotation.y += delta * 2;
    ref.current.position.y = 0.6 + Math.sin(Date.now() * 0.003) * 0.15;
  });

  if (carrot.collected) return null;

  return (
    <group ref={ref} position={[carrot.x, 0.6, carrot.z]}>
      <primitive object={clonedScene} scale={CARROT_SCALE} />
    </group>
  );
}

useGLTF.preload(CARROT_MODEL_PATH);

// ─── Ground ──────────────────────────────────────────────────────────────────

function Ground() {
  const [colorMap, normalMap] = useTexture([
    "/textures/Poliigon_GrassPatchyGround_4585_BaseColor.jpg",
    "/textures/Poliigon_GrassPatchyGround_4585_Normal.png",
  ]);

  useMemo(() => {
    for (const tex of [colorMap, normalMap]) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 20);
    }
  }, [colorMap, normalMap]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <circleGeometry args={[WORLD_RADIUS, 64]} />
      <meshStandardMaterial map={colorMap} normalMap={normalMap} />
    </mesh>
  );
}

// ─── Dirt path ring to give some visual interest ─────────────────────────────

function Path() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[18, 20, 64]} />
      <meshStandardMaterial color="#c9a96e" />
    </mesh>
  );
}

// ─── Third-person camera ─────────────────────────────────────────────────────

function CameraFollow({
  target,
}: {
  target: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const offset = useMemo(() => new THREE.Vector3(0, 4, 8), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!target.current) return;
    const pos = target.current.position;
    const rot = target.current.rotation.y;

    // Camera position behind and above rabbit
    camPos.set(
      pos.x + Math.sin(rot) * offset.z,
      pos.y + offset.y,
      pos.z + Math.cos(rot) * offset.z,
    );

    camera.position.lerp(camPos, 0.08);

    lookTarget.set(pos.x, pos.y + 1, pos.z);
    camera.lookAt(lookTarget);
  });

  return null;
}

// ─── Main scene ──────────────────────────────────────────────────────────────

function Scene({
  carrots,
  onCollectCarrot,
  paused,
  gameOver,
  onCaught,
  showMeshLabels,
}: {
  carrots: Carrot[];
  onCollectCarrot: (id: number) => void;
  paused: boolean;
  gameOver: boolean;
  onCaught: () => void;
  showMeshLabels: boolean;
}) {
  const rabbitGroup = useRef<THREE.Group>(null);
  const velocityY = useRef(0);
  const isOnGround = useRef(true);
  const speedBoostTimer = useRef(0);
  const keysRef = useRef({ left: false, right: false, up: false, down: false, space: false });
  const spaceWasPressed = useRef(false);
  const posY = useRef(GROUND_Y);

  // Keyboard input
  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
      if (e.key === "ArrowUp") keysRef.current.up = true;
      if (e.key === "ArrowDown") keysRef.current.down = true;
      if (e.key === " ") {
        e.preventDefault();
        keysRef.current.space = true;
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
      if (e.key === "ArrowUp") keysRef.current.up = false;
      if (e.key === "ArrowDown") keysRef.current.down = false;
      if (e.key === " ") keysRef.current.space = false;
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const onBoost = useCallback(() => {
    speedBoostTimer.current = SPEED_BOOST_DURATION;
  }, []);

  // Game loop (registers before Mr. Todd’s `useFrame` — same priority, runs first)
  useFrame((_, delta) => {
    if (!rabbitGroup.current || paused) return;
    const keys = keysRef.current;
    const rabbit = rabbitGroup.current;

    // Speed boost countdown
    if (speedBoostTimer.current > 0) speedBoostTimer.current -= delta;
    const speedMul = speedBoostTimer.current > 0 ? SPEED_BOOST_MULTIPLIER : 1;

    // Turning
    if (keys.left) rabbit.rotation.y += TURN_SPEED;
    if (keys.right) rabbit.rotation.y -= TURN_SPEED;

    // Hopping (space bar triggers a hop)
    if (keys.space && !spaceWasPressed.current && isOnGround.current) {
      velocityY.current = HOP_FORCE;
      isOnGround.current = false;
    }
    spaceWasPressed.current = keys.space;

    // Apply gravity
    velocityY.current += GRAVITY;
    posY.current += velocityY.current;

    if (posY.current <= GROUND_Y) {
      posY.current = GROUND_Y;
      velocityY.current = 0;
      isOnGround.current = true;
    }

    rabbit.position.y = posY.current;

    // Move forward/backward based on arrow keys (boosted when active)
    let forward = 0;
    if (keys.up) forward = FORWARD_SPEED * speedMul;
    if (keys.down) forward = -FORWARD_SPEED * 0.5 * speedMul;
    rabbit.position.x -= Math.sin(rabbit.rotation.y) * forward;
    rabbit.position.z -= Math.cos(rabbit.rotation.y) * forward;

    // World boundary
    const dist = Math.sqrt(rabbit.position.x ** 2 + rabbit.position.z ** 2);
    if (dist > WORLD_RADIUS - 3) {
      const angle = Math.atan2(rabbit.position.x, rabbit.position.z);
      rabbit.position.x = Math.sin(angle) * (WORLD_RADIUS - 3);
      rabbit.position.z = Math.cos(angle) * (WORLD_RADIUS - 3);
    }

    // Carrot collection
    for (const carrot of carrots) {
      if (carrot.collected) continue;
      const dx = rabbit.position.x - carrot.x;
      const dz = rabbit.position.z - carrot.z;
      if (dx * dx + dz * dz < 1.5) {
        onCollectCarrot(carrot.id);
      }
    }
  });

  return (
    <>
      <Environment files="/panoramic-view-field-covered-grass-trees-sunlight-cloudy-sky.jpg" background />
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 80, 50]} intensity={1.2} />

      <Ground />
      <Path />

      {/* Static world */}
      {WORLD.trees.map((t) => (
        <Tree key={`t-${t.x}-${t.z}`} data={t} />
      ))}
      {WORLD.flowers.map((f) => (
        <Flower key={`f-${f.x}-${f.z}`} data={f} />
      ))}
      {WORLD.rocks.map((r) => (
        <Rock key={`r-${r.x}-${r.z}`} data={r} />
      ))}
      {WORLD.gardens.map((g) => (
        <ChickenGarden key={`gd-${g.x}-${g.z}`} data={g} />
      ))}

      {/* Carrots */}
      {carrots.map((c) => (
        <CarrotItem key={c.id} carrot={c} />
      ))}

      {/* Peter Rabbit */}
      <group ref={rabbitGroup} position={[0, GROUND_Y, 0]}>
        <RabbitModel showMeshLabels={showMeshLabels} keysRef={keysRef} />
      </group>

      <MrTodd rabbitRef={rabbitGroup} paused={paused} />
      <MrMcGregor
        rabbitRef={rabbitGroup}
        paused={paused}
        gameOver={gameOver}
        onCaught={onCaught}
      />
      <Mercat
        rabbitRef={rabbitGroup}
        paused={paused}
        onBoost={onBoost}
      />

      <Pond />
      <JeremyFisher rabbitRef={rabbitGroup} paused={paused} />
      <QuinnRabbit rabbitRef={rabbitGroup} paused={paused} />

      <CameraFollow target={rabbitGroup} />
    </>
  );
}

// ─── HUD / UI overlay ────────────────────────────────────────────────────────

function HUD({
  collected,
  total,
  showMeshLabels,
}: {
  collected: number;
  total: number;
  showMeshLabels: boolean;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-2 pt-4">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg">
        Peter Rabbit&apos;s Meadow
      </h1>
      <div className="flex gap-4 text-lg text-white drop-shadow-md bg-black/30 rounded-full px-6 py-2">
        <span>
          Carrots: {collected}/{total}
        </span>
        {collected === total && (
          <span className="text-yellow-300 font-bold animate-pulse">
            You found them all!
          </span>
        )}
      </div>
      <p className="text-sm text-orange-100/95 drop-shadow-md max-w-md text-center px-4">
        Watch out for Mr. McGregor and Mr. Todd — collect all the carrots!
      </p>
      <div className="text-sm text-white/80 drop-shadow-sm mt-1">
        Space = Hop &middot; &uarr;/&darr; = Move &middot; &larr;/&rarr; = Steer &middot; M = mesh labels
      </div>
      {showMeshLabels && (
        <div className="mt-1 rounded-full bg-amber-900/85 px-4 py-1.5 text-xs text-amber-50 shadow-md ring-1 ring-amber-600/50">
          Mesh debug: numbers = traversal order (0, 1, 2…). Names from the GLB.
        </div>
      )}
    </div>
  );
}

// ─── Game wrapper ────────────────────────────────────────────────────────────

export default function Game() {
  const [carrots, setCarrots] = useState<Carrot[]>(() =>
    WORLD.carrots.map((c) => ({ ...c })),
  );
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showMeshLabels, setShowMeshLabels] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  const collectedCount = carrots.filter((c) => c.collected).length;

  const onCollectCarrot = useCallback((id: number) => {
    setCarrots((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c)),
    );
  }, []);

  const onCaught = useCallback(() => setGameOver(true), []);

  const restart = useCallback(() => {
    setGameOver(false);
    setCarrots(WORLD.carrots.map((c) => ({ ...c })));
    setSceneKey((k) => k + 1);
  }, []);

  // Background music — starts on first user interaction, loops quietly
  useEffect(() => {
    const music = new Audio("/bg-music.mp3");
    music.loop = true;
    music.volume = 0.35;
    const startMusic = () => {
      music.play().catch(() => { });
      window.removeEventListener("click", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
    window.addEventListener("click", startMusic);
    window.addEventListener("keydown", startMusic);
    return () => {
      music.pause();
      window.removeEventListener("click", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === "m" || e.key === "M") {
        if (e.repeat) return;
        e.preventDefault();
        setShowMeshLabels((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black">
      <Canvas camera={{ fov: 60, near: 0.1, far: 500, position: [0, 5, 10] }}>
        <Scene
          key={sceneKey}
          carrots={carrots}
          onCollectCarrot={onCollectCarrot}
          paused={paused || gameOver}
          gameOver={gameOver}
          onCaught={onCaught}
          showMeshLabels={showMeshLabels}
        />
      </Canvas>
      <HUD
        collected={collectedCount}
        total={CARROT_COUNT}
        showMeshLabels={showMeshLabels}
      />
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
            <h2 className="text-4xl font-bold text-red-800">Caught by Mr. McGregor!</h2>
            <p className="text-lg text-amber-800">
              Peter should have stayed out of the garden...
            </p>
            <button
              type="button"
              onClick={restart}
              className="px-8 py-3 bg-green-600 text-white text-xl font-bold rounded-full hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      {paused && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
            <h2 className="text-4xl font-bold text-amber-900">Paused</h2>
            <p className="text-lg text-amber-800">
              Peter is taking a little rest...
            </p>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="px-8 py-3 bg-green-600 text-white text-xl font-bold rounded-full hover:bg-green-700 transition-colors"
            >
              Resume
            </button>
            <p className="text-sm text-amber-700">Press Escape to resume</p>
          </div>
        </div>
      )}
    </div>
  );
}
