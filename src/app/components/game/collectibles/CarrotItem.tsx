"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { CARROT_MODEL_PATH, CARROT_SCALE } from "../constants";
import type { Carrot } from "../types";

export function CarrotItem({ carrot }: { carrot: Carrot }) {
  const { scene } = useGLTF(CARROT_MODEL_PATH);
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh)
          .material as THREE.MeshStandardMaterial;
        if (mat.name.startsWith("carrot")) {
          mat.color.set("#FF8C00");
          mat.emissive.set("#FF4500");
          mat.emissiveIntensity = 0.3;
        } else if (mat.name.startsWith("leaf")) {
          mat.color.set("#32CD32");
        }
      }
    });
    return clone;
  }, [scene]);
  const ref = useRef<THREE.Group>(null);
  const collected = useRef(false);

  useFrame((_, delta) => {
    if (!ref.current || collected.current) return;
    ref.current.rotation.y += delta * 2;
    ref.current.position.y = 0.6 + Math.sin(Date.now() * 0.003) * 0.15;
  });

  if (carrot.collected) return null;

  return (
    <group ref={ref} position={[carrot.x, 0.6, carrot.z]}>
      <primitive object={clonedScene} scale={CARROT_SCALE} />
    </group>
  );
}

useGLTF.preload(CARROT_MODEL_PATH);
