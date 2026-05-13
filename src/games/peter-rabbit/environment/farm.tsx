"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  FARM_MODEL_PATH,
  FARM_ROTATION_Y,
  FARM_SCALE,
  FARM_X,
  FARM_Y_OFFSET,
  FARM_Z,
  GROUND_Y,
} from "../constants";

useGLTF.preload(FARM_MODEL_PATH);

export function Farm() {
  const { scene } = useGLTF(FARM_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(FARM_X, GROUND_Y + FARM_Y_OFFSET, FARM_Z);
    g.rotation.y = FARM_ROTATION_Y;
    g.scale.setScalar(FARM_SCALE);
  }, []);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}
