"use client";

import type { FlowerData } from "../types";

export function Flower({ data }: { data: FlowerData }) {
  return (
    <group position={[data.x, 0, data.z]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={data.color} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
}
