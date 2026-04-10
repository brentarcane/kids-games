"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { FISHING_ROD_MODEL_PATH, FISHING_ROD_SCALE } from "../constants";

useGLTF.preload(FISHING_ROD_MODEL_PATH);

/** Bare rod model — reused for carried / delivered / world-spawn variants. */
export function FishingRodModel({ scale }: { scale?: number }) {
  const { scene } = useGLTF(FISHING_ROD_MODEL_PATH);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  return <primitive object={cloned} scale={scale ?? FISHING_ROD_SCALE} />;
}

export function FishingRod({
  x,
  z,
  pickedUp,
}: {
  x: number;
  z: number;
  pickedUp: boolean;
}) {
  const { scene } = useGLTF(FISHING_ROD_MODEL_PATH);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 1.5;
    ref.current.position.y = 1.0 + Math.sin(Date.now() * 0.003) * 0.2;
  });

  if (pickedUp) return null;

  return (
    <group ref={ref} position={[x, 1.0, z]}>
      <primitive object={clonedScene} scale={FISHING_ROD_SCALE} />
      {/* Glowing beacon so the rod is easier to spot */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color="#00ddff"
          emissive="#00ddff"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
