"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { GROUND_Y, POND_MODEL_PATH, POND_SCALE, POND_X, POND_Z } from "../constants";

useGLTF.preload(POND_MODEL_PATH);

export function Pond() {
  const { scene } = useGLTF(POND_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(POND_X, GROUND_Y - 1.5, POND_Z);
    g.scale.setScalar(POND_SCALE);
  }, []);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}
