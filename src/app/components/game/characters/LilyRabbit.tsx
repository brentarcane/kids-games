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
  LILY_FOLLOW_DISTANCE,
  LILY_FOLLOW_SMOOTHING,
  LILY_MODEL_PATH,
  LILY_SCALE,
  LILY_VOICE_INTERVAL,
  LILY_VOICE_LINES,
  LILY_VOICE_PATHS,
  LILY_WALK_THRESHOLD,
  LILY_Y_OFFSET,
} from "../constants";

const TRAIL_LENGTH = 30;
const TRAIL_INTERVAL = 0.05; // seconds between trail samples

export function LilyRabbit({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(LILY_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);

  // Voice line rotation
  const audiosRef = useRef<HTMLAudioElement[]>([]);
  const voiceTimer = useRef(0);
  const voiceIndex = useRef(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Trail of recent Peter positions [x, z] with timestamps
  const trail = useRef<Array<{ x: number; z: number; rotY: number }>>([]);
  const sampleTimer = useRef(0);
  const lastPos = useRef(new THREE.Vector2());

  useLayoutEffect(() => {
    const g = groupRef.current;
    const peter = rabbitRef.current;
    if (!g) return;
    // Spawn a bit behind Peter's starting position
    const startX = peter?.position.x ?? 0;
    const startZ = (peter?.position.z ?? 0) + LILY_FOLLOW_DISTANCE;
    g.position.set(startX, GROUND_Y + LILY_Y_OFFSET, startZ);
    g.scale.setScalar(LILY_SCALE);
    lastPos.current.set(startX, startZ);
  }, [rabbitRef]);

  // Preload voice audio elements once
  useEffect(() => {
    audiosRef.current = LILY_VOICE_PATHS.map((p) => {
      const a = new Audio(p);
      a.preload = "auto";
      return a;
    });
    const audios = audiosRef.current;
    return () => {
      for (const a of audios) {
        a.pause();
        a.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /walk|run|hop|move/i.test(c.name)) ??
      gltfClips.find((c) => /idle/i.test(c.name)) ??
      gltfClips[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity).play();
      walkActionRef.current = action;
    }
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
      walkActionRef.current = null;
    };
  }, [gltfClips, clonedScene]);

  useFrame((_, delta) => {
    const lily = groupRef.current;
    const peter = rabbitRef.current;
    if (!lily || !peter || paused) return;

    if (mixerRef.current) mixerRef.current.update(delta);

    // Voice line rotation
    voiceTimer.current += delta;
    if (voiceTimer.current >= LILY_VOICE_INTERVAL) {
      voiceTimer.current = 0;
      const idx = voiceIndex.current;
      voiceIndex.current = (idx + 1) % LILY_VOICE_PATHS.length;
      const audio = audiosRef.current[idx];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setActiveLine(idx);
        audio.onended = () => setActiveLine(null);
      }
    }

    // Sample Peter's position into the trail buffer at a fixed interval
    sampleTimer.current += delta;
    if (sampleTimer.current >= TRAIL_INTERVAL) {
      sampleTimer.current = 0;
      trail.current.push({
        x: peter.position.x,
        z: peter.position.z,
        rotY: peter.rotation.y,
      });
      if (trail.current.length > TRAIL_LENGTH) {
        trail.current.shift();
      }
    }

    // Target = oldest sample in the trail (where Peter was ~1.5s ago).
    // This gives Lily a natural "catching up" delay.
    const target = trail.current[0];
    if (!target) return;

    // Smoothly move toward target
    const smoothing = 1 - Math.exp(-LILY_FOLLOW_SMOOTHING * delta);
    const newX = lily.position.x + (target.x - lily.position.x) * smoothing;
    const newZ = lily.position.z + (target.z - lily.position.z) * smoothing;

    // Compute movement speed for walk animation gating
    const moveDx = newX - lastPos.current.x;
    const moveDz = newZ - lastPos.current.y;
    const speed = Math.sqrt(moveDx * moveDx + moveDz * moveDz) / Math.max(delta, 0.0001);

    lily.position.x = newX;
    lily.position.z = newZ;
    lastPos.current.set(newX, newZ);

    // Face direction of movement
    if (speed > 0.05) {
      const facing = Math.atan2(moveDx, moveDz);
      // Smooth rotation
      let dr = facing - lily.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      lily.rotation.y += dr * Math.min(1, delta * 8);
    }

    // Pause walk animation when not moving
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = speed < LILY_WALK_THRESHOLD;
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {activeLine !== null && (
        <Html
          center
          position={[0, 3, 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none" }}
          zIndexRange={[16777271, 0]}
        >
          <div className="whitespace-nowrap rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-lg ring-1 ring-gray-300">
            {LILY_VOICE_LINES[activeLine]}
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(LILY_MODEL_PATH);
