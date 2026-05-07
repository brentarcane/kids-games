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
import { useProximityVoice } from "@/hooks/use-proximity-voice";
import {
  GROUND_Y,
  STAR_COUNT,
  UNICORN_MODEL_PATH,
  UNICORN_SCALE,
  UNICORN_SPAWN_X,
  UNICORN_SPAWN_Z,
  UNICORN_SPEECH_RADIUS,
  UNICORN_VOICE_COOLDOWN,
  UNICORN_VOICE_PATH,
  UNICORN_VOICE_RADIUS,
} from "../constants";

const CIRCLE_RADIUS = 6;
const CIRCLE_SPEED = 0.8;
const RUN_DURATION = 4;
const PAUSE_DURATION = 2;

export function AdosSister({
  rabbitRef,
  paused,
  starsCollected,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  starsCollected: number;
}) {
  const { scene, animations: gltfClips } = useGLTF(UNICORN_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const [showSpeech, setShowSpeech] = useState(false);
  const updateVoice = useProximityVoice(UNICORN_VOICE_PATH, {
    radius: UNICORN_VOICE_RADIUS,
    cooldown: UNICORN_VOICE_COOLDOWN,
  });

  // Circle movement state
  const circleAngle = useRef(0);
  const cycleTimer = useRef(0);
  const isRunning = useRef(true);

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(UNICORN_SPAWN_X + CIRCLE_RADIUS, GROUND_Y, UNICORN_SPAWN_Z);
    g.scale.setScalar(UNICORN_SCALE);
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /run|gallop|idle|walk/i.test(c.name)) ??
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
    const uni = groupRef.current;
    if (!uni || paused) return;

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Run/pause cycle
    cycleTimer.current += delta;
    if (isRunning.current && cycleTimer.current >= RUN_DURATION) {
      isRunning.current = false;
      cycleTimer.current = 0;
      if (walkActionRef.current) walkActionRef.current.paused = true;
    } else if (!isRunning.current && cycleTimer.current >= PAUSE_DURATION) {
      isRunning.current = true;
      cycleTimer.current = 0;
      if (walkActionRef.current) walkActionRef.current.paused = false;
    }

    // Move in circle when running
    if (isRunning.current) {
      circleAngle.current += CIRCLE_SPEED * delta;
      const cx =
        UNICORN_SPAWN_X + Math.cos(circleAngle.current) * CIRCLE_RADIUS;
      const cz =
        UNICORN_SPAWN_Z + Math.sin(circleAngle.current) * CIRCLE_RADIUS;
      uni.position.x = cx;
      uni.position.z = cz;

      // Face movement direction (tangent to circle)
      const facingAngle = circleAngle.current + Math.PI / 2;
      uni.rotation.y = facingAngle;
    }

    // Speech proximity
    const rabbit = rabbitRef.current;
    if (!rabbit) return;
    const dx = rabbit.position.x - uni.position.x;
    const dz = rabbit.position.z - uni.position.z;
    const distSq = dx * dx + dz * dz;
    setShowSpeech(distSq < UNICORN_SPEECH_RADIUS * UNICORN_SPEECH_RADIUS);
    updateVoice(delta, distSq);
  });

  const message =
    starsCollected === 0
      ? "I\u2019m Ado\u2019s Sister! Collect all 5 magic stars for me!"
      : starsCollected < STAR_COUNT
        ? `You\u2019ve found ${starsCollected} of ${STAR_COUNT} stars \u2014 keep going!`
        : "All stars collected! You\u2019re a true star, Peter!";

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
            {message}
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(UNICORN_MODEL_PATH);
