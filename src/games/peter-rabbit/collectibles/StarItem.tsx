"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Star } from "../types";

const STAR_COLOR = new THREE.Color("#FFD700");
const STAR_EMISSIVE = new THREE.Color("#FFA500");

export function StarItem({ star }: { star: Star }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 3;
    ref.current.position.y = 1.5 + Math.sin(Date.now() * 0.004) * 0.25;
  });

  if (star.collected) return null;

  return (
    <mesh ref={ref} position={[star.x, 1.5, star.z]}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color={STAR_COLOR}
        emissive={STAR_EMISSIVE}
        emissiveIntensity={0.6}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
