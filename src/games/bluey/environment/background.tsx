"use client";

import { useMemo } from "react";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Static parallax-friendly background: a stretched cloud band well behind
 * the action plane and a few rolling hills. Everything sits at -Z so it
 * doesn't intersect platforms.
 */
export function Background() {
  const clouds = useMemo(() => {
    const rng = seededRandom(42);
    const out: { x: number; y: number; z: number; scale: number }[] = [];
    for (let i = 0; i < 30; i++) {
      out.push({
        x: -20 + i * 8 + (rng() - 0.5) * 4,
        y: 12 + rng() * 10,
        z: -25 - rng() * 20,
        scale: 1.5 + rng() * 1.8,
      });
    }
    return out;
  }, []);

  const hills = useMemo(() => {
    const rng = seededRandom(7);
    const out: { x: number; z: number; r: number }[] = [];
    for (let i = 0; i < 12; i++) {
      out.push({
        x: -10 + i * 14 + (rng() - 0.5) * 4,
        z: -18 - rng() * 6,
        r: 6 + rng() * 4,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {/* Distant rolling hills */}
      {hills.map((h, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: stable seeded layout
          key={`h${i}`}
          position={[h.x, -h.r * 0.5, h.z]}
        >
          <sphereGeometry args={[h.r, 16, 12]} />
          <meshStandardMaterial color="#83c75a" />
        </mesh>
      ))}

      {/* Puffy clouds */}
      {clouds.map((c, i) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: stable seeded layout
          key={`c${i}`}
          position={[c.x, c.y, c.z]}
          scale={c.scale}
        >
          <mesh>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.7, 0.1, 0]} scale={0.8}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.6, 0.05, 0]} scale={0.7}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
