"use client";

import { GROUND_SIZE, GROUND_Y } from "../constants";

export function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, GROUND_Y, 0]}
      receiveShadow
    >
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial color="#4a8a3a" />
    </mesh>
  );
}
