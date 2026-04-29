"use client";

import type { RockData } from "../types";

export function Rock({ data }: { data: RockData }) {
  return (
    <mesh position={[data.x, data.scale * 0.3, data.z]} scale={data.scale}>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#888888" flatShading />
    </mesh>
  );
}
