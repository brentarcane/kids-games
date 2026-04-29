"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import {
  CHICKEN_MODEL_PATH,
  CHICKEN_SCALE,
  FENCE_POST_HEIGHT,
  FENCE_SECTION_WIDTH,
} from "../constants";
import type { GardenData } from "../types";

function ChickenModel({ facing }: { facing: number }) {
  const { scene } = useGLTF(CHICKEN_MODEL_PATH);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return (
    <group rotation={[0, facing, 0]}>
      <primitive object={cloned} scale={CHICKEN_SCALE} />
    </group>
  );
}

useGLTF.preload(CHICKEN_MODEL_PATH);

function FenceWall({ sections, length }: { sections: number; length: number }) {
  const posts = sections + 1;
  const totalWidth = sections * FENCE_SECTION_WIDTH;
  return (
    <group>
      {Array.from({ length: posts }).map((_, i) => {
        const px = i * FENCE_SECTION_WIDTH - totalWidth / 2;
        return (
          <mesh
            key={`p-${length}-${px}`}
            position={[px, FENCE_POST_HEIGHT / 2, 0]}
          >
            <boxGeometry args={[0.12, FENCE_POST_HEIGHT, 0.12]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        );
      })}
      {Array.from({ length: sections }).map((_, i) => {
        const rx =
          i * FENCE_SECTION_WIDTH - totalWidth / 2 + FENCE_SECTION_WIDTH / 2;
        return (
          <group key={`r-${length}-${rx}`}>
            <mesh position={[rx, FENCE_POST_HEIGHT * 0.8, 0]}>
              <boxGeometry args={[FENCE_SECTION_WIDTH - 0.1, 0.08, 0.06]} />
              <meshStandardMaterial color="#8B6914" />
            </mesh>
            <mesh position={[rx, FENCE_POST_HEIGHT * 0.35, 0]}>
              <boxGeometry args={[FENCE_SECTION_WIDTH - 0.1, 0.08, 0.06]} />
              <meshStandardMaterial color="#8B6914" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function ChickenGarden({ data }: { data: GardenData }) {
  const halfW = (data.width * FENCE_SECTION_WIDTH) / 2;
  const halfD = (data.depth * FENCE_SECTION_WIDTH) / 2;
  return (
    <group position={[data.x, 0, data.z]} rotation={[0, data.rotation, 0]}>
      <group position={[0, 0, halfD]}>
        <FenceWall sections={data.width} length={0} />
      </group>
      <group position={[0, 0, -halfD]}>
        <FenceWall sections={data.width} length={1} />
      </group>
      <group position={[-halfW, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <FenceWall sections={data.depth} length={2} />
      </group>
      <group position={[halfW, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <FenceWall sections={data.depth} length={3} />
      </group>
      {data.chickens.map((ch, i) => (
        <group
          key={`ch-${data.x}-${data.z}-${i}`}
          position={[ch.cx, 0.3, ch.cz]}
        >
          <ChickenModel facing={ch.facing} />
        </group>
      ))}
    </group>
  );
}
