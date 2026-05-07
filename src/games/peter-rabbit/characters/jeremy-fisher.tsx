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
import { FishingRodModel } from "../collectibles/fishing-rod";
import {
  FISHING_ROD_DELIVER_RADIUS,
  FISHING_ROD_SCALE,
  FROG_MODEL_PATH,
  FROG_SCALE,
  FROG_SPAWN_X,
  FROG_SPAWN_Z,
  FROG_SPEECH_RADIUS,
  FROG_VOICE_COOLDOWN,
  FROG_VOICE_RADIUS,
  GROUND_Y,
  JEREMY_FISHER_VOICE_PATH,
} from "../constants";
import { useProximityVoice } from "../hooks/use-proximity-voice";

export function JeremyFisher({
  rabbitRef,
  paused,
  rodPickedUp,
  rodDelivered,
  onDeliverRod,
  fishFound,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  rodPickedUp: boolean;
  rodDelivered: boolean;
  onDeliverRod: () => void;
  fishFound: boolean;
}) {
  const { scene, animations: gltfClips } = useGLTF(FROG_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [showSpeech, setShowSpeech] = useState(false);
  const updateVoice = useProximityVoice(JEREMY_FISHER_VOICE_PATH, {
    radius: FROG_VOICE_RADIUS,
    cooldown: FROG_VOICE_COOLDOWN,
  });

  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(FROG_SPAWN_X, GROUND_Y + 1, FROG_SPAWN_Z);
    g.scale.setScalar(FROG_SCALE);
  }, []);

  useEffect(() => {
    if (gltfClips.length === 0) return;
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const clip =
      gltfClips.find((c) => /idle|sit|croak/i.test(c.name)) ?? gltfClips[0];
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

    // Deliver the rod when Peter is carrying it and close enough
    if (
      rodPickedUp &&
      !rodDelivered &&
      distSq < FISHING_ROD_DELIVER_RADIUS * FISHING_ROD_DELIVER_RADIUS
    ) {
      onDeliverRod();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {/* Rod on the ground next to Jeremy Fisher after delivery */}
      {rodDelivered && (
        <group position={[8, -6, 3]} rotation={[Math.PI / 2, 0, 0.4]}>
          <FishingRodModel scale={FISHING_ROD_SCALE} />
        </group>
      )}
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
            {fishFound
              ? "Jack Sharp is safe! Thank you, dear Peter!"
              : rodDelivered
                ? "Now could you find my friend Jack Sharp? He\u2019s a fish — look near the far edge of the meadow!"
                : rodPickedUp
                  ? "Is that my fishing rod? Bring it here!"
                  : "Peter, I\u2019ve lost my fishing rod. Could you find it?"}
          </div>
        </Html>
      )}
    </group>
  );
}
