"use client";

import type { TreeData } from "../types";

export function Tree({ data }: { data: TreeData }) {
  return (
    <group position={[data.x, 0, data.z]} scale={data.scale}>
      <mesh position={[0, data.trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, data.trunkHeight, 8]} />
        <meshStandardMaterial color="#8B5E3C" />
      </mesh>
      <mesh position={[0, data.trunkHeight + data.leafRadius * 0.5, 0]}>
        <sphereGeometry args={[data.leafRadius, 8, 8]} />
        <meshStandardMaterial color="#2d7a2d" />
      </mesh>
      <mesh position={[0.5, data.trunkHeight + data.leafRadius * 0.3, 0.5]}>
        <sphereGeometry args={[data.leafRadius * 0.7, 8, 8]} />
        <meshStandardMaterial color="#3a9a3a" />
      </mesh>
      <mesh position={[-0.4, data.trunkHeight + data.leafRadius * 0.4, -0.3]}>
        <sphereGeometry args={[data.leafRadius * 0.6, 8, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </group>
  );
}
