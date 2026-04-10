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
  DINO_MODEL_PATH,
  DINO_SCALE,
  DINO_SPAWN_X,
  DINO_SPAWN_Z,
  DINO_SPEECH_RADIUS,
  GROUND_Y,
} from "../constants";

// ─── Floating hearts ────────────────────────────────────────────────────────

type Heart = { id: number; x: number; age: number; speed: number };
let heartId = 0;

const HEART_LIFETIME = 1.8;
const HEART_SPAWN_INTERVAL = 0.35;

function FloatingHearts({ active }: { active: boolean }) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const spawnTimer = useRef(0);

  useFrame((_, delta) => {
    if (active) {
      spawnTimer.current += delta;
      if (spawnTimer.current >= HEART_SPAWN_INTERVAL) {
        spawnTimer.current = 0;
        setHearts((prev) => [
          ...prev,
          {
            id: heartId++,
            x: (Math.random() - 0.5) * 1.6,
            age: 0,
            speed: 1.5 + Math.random() * 1,
          },
        ]);
      }
    } else {
      spawnTimer.current = 0;
    }

    setHearts((prev) =>
      prev
        .map((h) => ({ ...h, age: h.age + delta }))
        .filter((h) => h.age < HEART_LIFETIME),
    );
  });

  return (
    <Html
      center
      position={[0, 4, 0]}
      distanceFactor={14}
      occlude={false}
      style={{ pointerEvents: "none" }}
      zIndexRange={[16777270, 0]}
    >
      <div className="relative w-24 h-20">
        {hearts.map((h) => {
          const progress = h.age / HEART_LIFETIME;
          const y = progress * 50;
          const opacity = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
          return (
            <span
              key={h.id}
              className="absolute text-4xl select-none"
              style={{
                left: `${50 + h.x * 30}%`,
                bottom: `${y}%`,
                opacity: Math.max(0, opacity),
                transform: `scale(${0.6 + opacity * 0.5})`,
                transition: "none",
              }}
            >
              💛
            </span>
          );
        })}
      </div>
    </Html>
  );
}

// ─── Fred component ─────────────────────────────────────────────────────────

const HOP_HEIGHT = 0.5;
const HOP_SPEED = 6;

export function Fred({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(DINO_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [nearby, setNearby] = useState(false);
  const hopTime = useRef(0);

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(DINO_SPAWN_X, GROUND_Y, DINO_SPAWN_Z);
    g.scale.setScalar(DINO_SCALE);
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /idle|stand|walk/i.test(c.name)) ?? gltfClips[0];
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
    const dino = groupRef.current;
    if (!dino || paused) return;

    if (mixerRef.current) mixerRef.current.update(delta);

    const rabbit = rabbitRef.current;
    if (!rabbit) return;
    const dx = rabbit.position.x - dino.position.x;
    const dz = rabbit.position.z - dino.position.z;
    const distSq = dx * dx + dz * dz;
    const isNearby = distSq < DINO_SPEECH_RADIUS * DINO_SPEECH_RADIUS;
    setNearby(isNearby);

    // Hop when Peter is nearby
    if (isNearby) {
      hopTime.current += delta * HOP_SPEED;
      const hop = Math.abs(Math.sin(hopTime.current)) * HOP_HEIGHT;
      dino.position.y = GROUND_Y + hop;
    } else {
      hopTime.current = 0;
      dino.position.y = GROUND_Y;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      <FloatingHearts active={nearby} />
      {nearby && (
        <Html
          center
          position={[0, 5.5, 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none" }}
          zIndexRange={[16777271, 0]}
        >
          <div className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-lg ring-1 ring-gray-300">
            Hi Peter Rabbit!
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(DINO_MODEL_PATH);
