"use client";

import { type RefObject, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  FOX_MODEL_PATH,
  FOX_MODEL_YAW,
  FOX_ROAM_RANGE,
  FOX_ROAM_SPEED,
  FOX_SCALE,
  FOX_SPAWN_X,
  FOX_SPAWN_Z,
  FOX_VOICE_COOLDOWN,
  FOX_VOICE_RADIUS,
  FOX_WAYPOINT_RADIUS,
  MR_TODD_VOICE_PATH,
} from "../constants";
import { useAnimatedModel } from "../hooks/useAnimatedModel";
import { useProximityVoice } from "../hooks/useProximityVoice";
import { useRoamingNPC } from "../hooks/useRoamingNPC";

function FoxModel({ paused }: { paused: boolean }) {
  const { clonedScene, animRootRef, walkActionRef } = useAnimatedModel(
    FOX_MODEL_PATH,
    { clone: "skeleton" },
  );

  useFrame(() => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;
  });

  return (
    <group ref={animRootRef} rotation={[0, FOX_MODEL_YAW, 0]}>
      <primitive object={clonedScene} scale={FOX_SCALE} />
    </group>
  );
}

useGLTF.preload(FOX_MODEL_PATH);

export function MrTodd({
  rabbitRef,
  paused,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
}) {
  const updateVoice = useProximityVoice(MR_TODD_VOICE_PATH, {
    radius: FOX_VOICE_RADIUS,
    cooldown: FOX_VOICE_COOLDOWN,
  });

  const { groupRef } = useRoamingNPC(
    {
      spawnX: FOX_SPAWN_X,
      spawnZ: FOX_SPAWN_Z,
      spawnY: 2,
      roamSpeed: FOX_ROAM_SPEED,
      roamRange: FOX_ROAM_RANGE,
      waypointRadius: FOX_WAYPOINT_RADIUS,
    },
    paused,
    (delta, npcPos) => {
      const rabbit = rabbitRef.current;
      if (!rabbit) return;
      const dx = rabbit.position.x - npcPos.x;
      const dz = rabbit.position.z - npcPos.z;
      updateVoice(delta, dx * dx + dz * dz);
    },
    rabbitRef,
  );

  return (
    <group ref={groupRef}>
      <FoxModel paused={paused} />
    </group>
  );
}
