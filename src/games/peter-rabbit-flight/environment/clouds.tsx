"use client";

import { useMemo } from "react";
import { CLOUD_COUNT } from "../constants";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function Clouds() {
  const positions = useMemo(() => {
    const rng = seededRandom(99);
    const out: { x: number; y: number; z: number; scale: number }[] = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      out.push({
        x: (rng() - 0.5) * 600,
        y: 20 + rng() * 60,
        z: (rng() - 0.5) * 600,
        scale: 4 + rng() * 6,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: positions are stable
          key={i}
          position={[p.x, p.y, p.z]}
          scale={p.scale}
        >
          <mesh>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.7, 0.1, 0.1]} scale={0.7}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.6, 0.05, -0.2]} scale={0.65}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
