"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import {
  RING_ACTIVE_COLOR,
  RING_INACTIVE_COLOR,
  RING_PASSED_COLOR,
  RING_RADIUS,
  RING_TUBE,
} from "../constants";
import type { Ring as RingType } from "../types";

export function Ring({
  ring,
  active,
}: {
  ring: RingType;
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Rings spin gently around their face axis (local Z after yaw rotation)
    meshRef.current.rotation.z += delta * (active ? 1.5 : 0.4);
  });

  const color = ring.passed
    ? RING_PASSED_COLOR
    : active
      ? RING_ACTIVE_COLOR
      : RING_INACTIVE_COLOR;
  const emissiveIntensity = active ? 0.9 : ring.passed ? 0.3 : 0.15;

  return (
    <group position={[ring.x, ring.y, ring.z]} rotation={[0, ring.yaw, 0]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 16, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
