"use client";

import { type RefObject, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  FARMER_CATCH_RADIUS,
  FARMER_MODEL_PATH,
  FARMER_ROAM_RANGE,
  FARMER_ROAM_SPEED,
  FARMER_SCALE,
  FARMER_SPAWN_X,
  FARMER_SPAWN_Z,
  FARMER_WAYPOINT_RADIUS,
  GROUND_Y,
} from "../constants";
import { useAnimatedModel } from "../hooks/useAnimatedModel";

function FarmerModel({ paused }: { paused: boolean }) {
  const { clonedScene, animRootRef, walkActionRef } = useAnimatedModel(
    FARMER_MODEL_PATH,
  );

  useFrame(() => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;
  });

  return (
    <group ref={animRootRef}>
      <primitive object={clonedScene} scale={FARMER_SCALE} />
    </group>
  );
}

useGLTF.preload(FARMER_MODEL_PATH);

function pickFarmerWaypoint(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * FARMER_ROAM_RANGE;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

export function MrMcGregor({
  rabbitRef,
  paused,
  gameOver,
  onCaught,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  gameOver: boolean;
  onCaught: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const waypoint = useRef<[number, number]>(pickFarmerWaypoint());
  const caughtSentRef = useRef(false);
  const _look = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(FARMER_SPAWN_X, GROUND_Y, FARMER_SPAWN_Z);
  }, []);

  useFrame(() => {
    const farmer = groupRef.current;
    const rabbit = rabbitRef.current;
    if (!farmer || !rabbit || paused || gameOver) return;

    const rx = rabbit.position.x;
    const rz = rabbit.position.z;
    let fx = farmer.position.x;
    let fz = farmer.position.z;

    const cdx = rx - fx;
    const cdz = rz - fz;
    if (
      !caughtSentRef.current &&
      cdx * cdx + cdz * cdz < FARMER_CATCH_RADIUS * FARMER_CATCH_RADIUS
    ) {
      caughtSentRef.current = true;
      onCaught();
      return;
    }

    const [wx, wz] = waypoint.current;
    const dx = wx - fx;
    const dz = wz - fz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < FARMER_WAYPOINT_RADIUS) {
      waypoint.current = pickFarmerWaypoint();
      return;
    }

    fx += (dx / dist) * FARMER_ROAM_SPEED;
    fz += (dz / dist) * FARMER_ROAM_SPEED;

    farmer.position.x = fx;
    farmer.position.z = fz;

    _look.set(wx, farmer.position.y, wz);
    farmer.lookAt(_look);
  });

  return (
    <group ref={groupRef}>
      <FarmerModel paused={paused || gameOver} />
    </group>
  );
}
