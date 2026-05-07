"use client";

import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  GROUND_Y,
  MOUSE_BOX_HALF,
  MOUSE_DETECT_RADIUS,
  MOUSE_FLEE_DISTANCE,
  MOUSE_FLEE_RANDOM_ANGLE,
  MOUSE_FLEE_SPEED,
  MOUSE_MODEL_PATH,
  MOUSE_REACTION_MAX,
  MOUSE_REACTION_MIN,
  MOUSE_SCALE,
  MOUSE_SPAWN_X,
  MOUSE_SPAWN_Z,
  MOUSE_WORLD_MARGIN,
  WORLD_RADIUS,
} from "../constants";

type State = "idle" | "reacting" | "fleeing";

const MAX_WORLD_DIST = WORLD_RADIUS - MOUSE_WORLD_MARGIN;

function clampToBox(x: number, z: number) {
  const cx = Math.min(
    MOUSE_SPAWN_X + MOUSE_BOX_HALF,
    Math.max(MOUSE_SPAWN_X - MOUSE_BOX_HALF, x),
  );
  const cz = Math.min(
    MOUSE_SPAWN_Z + MOUSE_BOX_HALF,
    Math.max(MOUSE_SPAWN_Z - MOUSE_BOX_HALF, z),
  );
  const dist = Math.sqrt(cx * cx + cz * cz);
  if (dist > MAX_WORLD_DIST) {
    const k = MAX_WORLD_DIST / dist;
    return { x: cx * k, z: cz * k };
  }
  return { x: cx, z: cz };
}

export function SammyWhiskers({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(MOUSE_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const stateRef = useRef<State>("idle");
  const reactionTimer = useRef(0);
  const fleeRemaining = useRef(0);
  const fleeDir = useRef(new THREE.Vector2(0, 1));
  const [showLabel, setShowLabel] = useState(false);

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(MOUSE_SPAWN_X, GROUND_Y, MOUSE_SPAWN_Z);
    g.scale.setScalar(MOUSE_SCALE);
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /idle|stand|run|walk|move/i.test(c.name)) ??
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
    const mouse = groupRef.current;
    if (!mouse || paused) return;

    if (mixerRef.current) mixerRef.current.update(delta);

    const rabbit = rabbitRef.current;
    if (!rabbit) return;

    const dx = mouse.position.x - rabbit.position.x;
    const dz = mouse.position.z - rabbit.position.z;
    const distSq = dx * dx + dz * dz;
    const peterClose = distSq < MOUSE_DETECT_RADIUS * MOUSE_DETECT_RADIUS;

    setShowLabel(peterClose);

    if (stateRef.current === "idle") {
      if (peterClose) {
        stateRef.current = "reacting";
        reactionTimer.current =
          MOUSE_REACTION_MIN +
          Math.random() * (MOUSE_REACTION_MAX - MOUSE_REACTION_MIN);
      }
    } else if (stateRef.current === "reacting") {
      reactionTimer.current -= delta;
      if (reactionTimer.current <= 0) {
        const dist = Math.sqrt(distSq) || 1;
        const awayX = dx / dist;
        const awayZ = dz / dist;
        const jitter = (Math.random() * 2 - 1) * MOUSE_FLEE_RANDOM_ANGLE;
        const cos = Math.cos(jitter);
        const sin = Math.sin(jitter);
        fleeDir.current.set(
          awayX * cos - awayZ * sin,
          awayX * sin + awayZ * cos,
        );
        fleeRemaining.current = MOUSE_FLEE_DISTANCE;
        stateRef.current = "fleeing";
      }
    } else if (stateRef.current === "fleeing") {
      const step = MOUSE_FLEE_SPEED * delta;
      const proposedX = mouse.position.x + fleeDir.current.x * step;
      const proposedZ = mouse.position.z + fleeDir.current.y * step;
      const clamped = clampToBox(proposedX, proposedZ);

      // If the box clamped us, the bolt is over — Sammy stops at the wall.
      const blocked =
        Math.abs(clamped.x - proposedX) > 1e-4 ||
        Math.abs(clamped.z - proposedZ) > 1e-4;

      mouse.position.x = clamped.x;
      mouse.position.z = clamped.z;

      const targetY = Math.atan2(fleeDir.current.x, fleeDir.current.y);
      let dr = targetY - mouse.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      mouse.rotation.y += dr * Math.min(1, delta * 12);

      fleeRemaining.current -= step;
      if (blocked || fleeRemaining.current <= 0) {
        stateRef.current = "idle";
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {showLabel && (
        <Html
          center
          position={[0, 2.2, 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none" }}
          zIndexRange={[16777271, 0]}
        >
          <div className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-lg ring-1 ring-gray-300">
            Sammy Whiskers!
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(MOUSE_MODEL_PATH);
