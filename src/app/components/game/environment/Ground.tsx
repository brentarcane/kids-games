"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  GROUND_COLOR_MAP_PATH,
  GROUND_NORMAL_MAP_PATH,
  WORLD_RADIUS,
} from "../constants";

export function Ground() {
  const [colorMap, normalMap] = useTexture([
    GROUND_COLOR_MAP_PATH,
    GROUND_NORMAL_MAP_PATH,
  ]);

  useMemo(() => {
    for (const tex of [colorMap, normalMap]) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 20);
    }
  }, [colorMap, normalMap]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <circleGeometry args={[WORLD_RADIUS, 64]} />
      <meshStandardMaterial map={colorMap} normalMap={normalMap} />
    </mesh>
  );
}
