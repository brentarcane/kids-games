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
  SPIDER_CIRCLE_RADIUS,
  SPIDER_CIRCLE_SPEED,
  SPIDER_MODEL_PATH,
  SPIDER_SCALE,
  SPIDER_SPAWN_X,
  SPIDER_SPAWN_Z,
  SPIDER_SPEECH_RADIUS,
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
          const opacity =
            progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
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

// ─── Spider component ───────────────────────────────────────────────────────

export function Spider({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(SPIDER_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [nearby, setNearby] = useState(false);
  const circleAngle = useRef(0);
  const lastPos = useRef(new THREE.Vector2(SPIDER_SPAWN_X, SPIDER_SPAWN_Z));

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    // Spider model uses deprecated KHR_materials_pbrSpecularGlossiness so
    // textures may not load. Fall back to a spider-like dark color when the
    // material has no diffuse map.
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && !mat.map) {
        mat.color.set("#3a2a20");
        mat.roughness = 0.7;
        mat.metalness = 0;
      }
    });
    return clone;
  }, [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(
      SPIDER_SPAWN_X + SPIDER_CIRCLE_RADIUS,
      GROUND_Y,
      SPIDER_SPAWN_Z,
    );
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /walk|crawl|run|move|idle/i.test(c.name)) ??
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
    const spider = groupRef.current;
    if (!spider || paused) return;

    if (mixerRef.current) mixerRef.current.update(delta);

    // Crawl in a small circle
    circleAngle.current += SPIDER_CIRCLE_SPEED * delta;
    const newX =
      SPIDER_SPAWN_X + Math.cos(circleAngle.current) * SPIDER_CIRCLE_RADIUS;
    const newZ =
      SPIDER_SPAWN_Z + Math.sin(circleAngle.current) * SPIDER_CIRCLE_RADIUS;

    // Face direction of movement (smoothed)
    const moveDx = newX - lastPos.current.x;
    const moveDz = newZ - lastPos.current.y;
    if (moveDx * moveDx + moveDz * moveDz > 1e-6) {
      const targetY = Math.atan2(moveDx, moveDz);
      let dr = targetY - spider.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      spider.rotation.y += dr * Math.min(1, delta * 10);
    }

    spider.position.x = newX;
    spider.position.z = newZ;
    lastPos.current.set(newX, newZ);

    // Speech proximity
    const rabbit = rabbitRef.current;
    if (!rabbit) return;
    const dx = rabbit.position.x - spider.position.x;
    const dz = rabbit.position.z - spider.position.z;
    const distSq = dx * dx + dz * dz;
    setNearby(distSq < SPIDER_SPEECH_RADIUS * SPIDER_SPEECH_RADIUS);
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={SPIDER_SCALE} />
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
            Peter Rabbit!! I heard it&apos;s your birthday!
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(SPIDER_MODEL_PATH);
