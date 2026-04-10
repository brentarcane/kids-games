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
  JACK_SHARP_FIND_RADIUS,
  JACK_SHARP_MODEL_PATH,
  JACK_SHARP_SCALE,
  JACK_SHARP_SPAWN_X,
  JACK_SHARP_SPAWN_Z,
  JACK_SHARP_SPEECH_RADIUS,
} from "../constants";

export function JackSharp({
  rabbitRef,
  paused,
  fishFound,
  onFindFish,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  fishFound: boolean;
  onFindFish: () => void;
}) {
  const { scene, animations: gltfClips } = useGLTF(JACK_SHARP_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [showSpeech, setShowSpeech] = useState(false);

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(JACK_SHARP_SPAWN_X, GROUND_Y, JACK_SHARP_SPAWN_Z);
    g.scale.setScalar(JACK_SHARP_SCALE);
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /idle|swim|float/i.test(c.name)) ?? gltfClips[0];
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
    const fish = groupRef.current;
    if (!rabbit || !fish) return;
    const dx = rabbit.position.x - fish.position.x;
    const dz = rabbit.position.z - fish.position.z;
    const distSq = dx * dx + dz * dz;
    setShowSpeech(distSq < JACK_SHARP_SPEECH_RADIUS * JACK_SHARP_SPEECH_RADIUS);

    if (
      !fishFound &&
      distSq < JACK_SHARP_FIND_RADIUS * JACK_SHARP_FIND_RADIUS
    ) {
      onFindFish();
    }
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
            {fishFound
              ? "Tell Jeremy Fisher I\u2019m doing just fine!"
              : "I\u2019m Jack Sharp! Are you looking for me?"}
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(JACK_SHARP_MODEL_PATH);
