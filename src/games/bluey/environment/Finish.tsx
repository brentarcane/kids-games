"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { FINISH_FLAG_HEIGHT } from "../constants";

/**
 * A red flag on a pole marking the end of the level. The flag waves a
 * little so it draws the eye.
 */
export function Finish({ x, y }: { x: number; y: number }) {
  const flagRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const f = flagRef.current;
    if (!f) return;
    f.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.15;
  });

  return (
    <group position={[x, y, 0]}>
      {/* Pole */}
      <mesh position={[0, FINISH_FLAG_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, FINISH_FLAG_HEIGHT, 8]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
      {/* Flag */}
      <mesh ref={flagRef} position={[0.85, FINISH_FLAG_HEIGHT - 0.6, 0]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshStandardMaterial color="#e23636" side={2 /* DoubleSide */} />
      </mesh>
    </group>
  );
}
