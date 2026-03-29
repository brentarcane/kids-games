"use client";

import type { RefObject } from "react";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export function CameraFollow({
  target,
}: {
  target: RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const offset = useMemo(() => new THREE.Vector3(0, 4, 8), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!target.current) return;
    const pos = target.current.position;
    const rot = target.current.rotation.y;

    camPos.set(
      pos.x + Math.sin(rot) * offset.z,
      pos.y + offset.y,
      pos.z + Math.cos(rot) * offset.z,
    );

    camera.position.lerp(camPos, 0.08);

    lookTarget.set(pos.x, pos.y + 1, pos.z);
    camera.lookAt(lookTarget);
  });

  return null;
}
