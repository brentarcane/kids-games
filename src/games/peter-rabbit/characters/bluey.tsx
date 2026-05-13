"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import type * as THREE from "three";
import { useAnimatedModel } from "@/hooks/use-animated-model";
import { useRoamingNPC } from "@/hooks/use-roaming-npc";
import {
  BLUEY_MODEL_PATH,
  BLUEY_MODEL_YAW,
  BLUEY_ROAM_RANGE,
  BLUEY_ROAM_SPEED,
  BLUEY_SCALE,
  BLUEY_SPAWN_X,
  BLUEY_SPAWN_Z,
  BLUEY_WAYPOINT_RADIUS,
  GROUND_Y,
} from "../constants";

function BlueyModel({ paused }: { paused: boolean }) {
  // SkeletonUtils.clone — Bluey's GLB is a skinned mesh; a basic clone leaves
  // the visible mesh bound to the original (un-mounted) skeleton.
  const { clonedScene, animRootRef, walkActionRef } = useAnimatedModel(
    BLUEY_MODEL_PATH,
    { clone: "skeleton" },
  );

  useFrame(() => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;
  });

  return (
    <group ref={animRootRef} rotation={[0, BLUEY_MODEL_YAW, 0]}>
      <primitive object={clonedScene} scale={BLUEY_SCALE} />
    </group>
  );
}

useGLTF.preload(BLUEY_MODEL_PATH);

export function Bluey({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const { groupRef } = useRoamingNPC(
    {
      spawnX: BLUEY_SPAWN_X,
      spawnZ: BLUEY_SPAWN_Z,
      spawnY: GROUND_Y,
      roamSpeed: BLUEY_ROAM_SPEED,
      roamRange: BLUEY_ROAM_RANGE,
      waypointRadius: BLUEY_WAYPOINT_RADIUS,
    },
    paused,
    undefined,
    rabbitRef,
  );

  return (
    <group ref={groupRef}>
      <BlueyModel paused={paused} />
    </group>
  );
}
