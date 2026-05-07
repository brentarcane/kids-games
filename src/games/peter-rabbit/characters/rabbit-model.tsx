"use client";

import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  GROUND_Y,
  HOP_HEIGHT_HINT,
  PROC_WALK_BOB_Y,
  PROC_WALK_FREQ,
  PROC_WALK_PITCH,
  PROC_WALK_ROLL,
  RABBIT_MODEL_PATH,
  RABBIT_MODEL_YAW,
  RABBIT_SCALE,
} from "../constants";

// ─── Mesh debug labels ──────────────────────────────────────────────────────

const _meshLabelBox = new THREE.Box3();
const _meshLabelCenter = new THREE.Vector3();

function collectMeshes(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  return meshes;
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

function RabbitMeshDebugLabels({ meshes }: { meshes: THREE.Mesh[] }) {
  return (
    <>
      {meshes.map((mesh, index) => (
        <MeshPartLabel key={mesh.uuid} index={index} mesh={mesh} />
      ))}
    </>
  );
}

// ─── Rabbit model ───────────────────────────────────────────────────────────

export function RabbitModel({
  showMeshLabels,
  keysRef,
  isFlipJump,
}: {
  showMeshLabels: boolean;
  keysRef: RefObject<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    space: boolean;
  }>;
  isFlipJump: RefObject<boolean>;
}) {
  const { scene, animations: gltfClips } = useGLTF(RABBIT_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const walkProcRef = useRef<THREE.Group>(null);
  const animRootRef = useRef<THREE.Group>(null);
  const prevParentY = useRef<number | null>(null);
  const squash = useRef(0);
  const walkPhase = useRef(0);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const flipProgress = useRef(0);
  const wasAirborne = useRef(false);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const debugMeshes = useMemo(() => collectMeshes(clonedScene), [clonedScene]);
  const hasGltfClips = gltfClips.length > 0;
  const { actions } = useAnimations(gltfClips, animRootRef);

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
    const moving = keys
      ? keys.up || keys.down || keys.left || keys.right
      : false;
    const walkAction = walkActionRef.current;
    if (walkAction) {
      walkAction.paused = airborne || !moving;
    }

    const wp = walkProcRef.current;
    if (wp && !hasGltfClips) {
      const a = airborne || !moving ? 0 : 1;
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
      if (!wasAirborne.current) {
        flipProgress.current = 0;
      }

      const t = THREE.MathUtils.clamp((y - GROUND_Y) / HOP_HEIGHT_HINT, 0, 1);
      const stretch = 1 + Math.sin(t * Math.PI) * 0.06;

      if (isFlipJump.current) {
        // Front flip: advance progress based on delta, complete full 360 in ~airtime
        flipProgress.current = Math.min(flipProgress.current + delta * 1.4, 1);
        // Smooth ease-in-out for the rotation
        const ease =
          flipProgress.current < 0.5
            ? 2 * flipProgress.current * flipProgress.current
            : 1 - (-2 * flipProgress.current + 2) ** 2 / 2;
        g.rotation.x = -ease * Math.PI * 2;
      } else {
        const lean = THREE.MathUtils.clamp(-vy * 0.35, -0.35, 0.45);
        g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, lean, 0.25);
      }
      g.scale.set(1, stretch * (1 - squash.current), 1);
    } else {
      if (wasAirborne.current) {
        flipProgress.current = 0;
      }
      g.rotation.x *= 0.82;
      const sy = 1 - squash.current;
      g.scale.x = THREE.MathUtils.lerp(g.scale.x, 1, 0.2);
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, sy, 0.25);
      g.scale.z = THREE.MathUtils.lerp(g.scale.z, 1, 0.2);
    }
    wasAirborne.current = airborne;
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
