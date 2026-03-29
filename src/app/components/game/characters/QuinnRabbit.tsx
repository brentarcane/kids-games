"use client";

import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  GROUND_Y,
  QUINN_MODEL_PATH,
  QUINN_SCALE,
  QUINN_SPAWN_X,
  QUINN_SPAWN_Z,
  QUINN_VOICE_COOLDOWN,
  QUINN_VOICE_PATH,
  QUINN_VOICE_RADIUS,
} from "../constants";
import { useProximityVoice } from "../hooks/useProximityVoice";

export function QuinnRabbit({
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
  const updateVoice = useProximityVoice(QUINN_VOICE_PATH, {
    radius: QUINN_VOICE_RADIUS,
    cooldown: QUINN_VOICE_COOLDOWN,
  });

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

useGLTF.preload(QUINN_MODEL_PATH);
