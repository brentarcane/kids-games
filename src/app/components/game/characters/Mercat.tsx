"use client";

import { type RefObject, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  GROUND_Y,
  MERCAT_MODEL_PATH,
  MERCAT_ROAM_RANGE,
  MERCAT_ROAM_SPEED,
  MERCAT_SCALE,
  MERCAT_SPAWN_X,
  MERCAT_SPAWN_Z,
  MERCAT_TOUCH_RADIUS,
  MERCAT_VOICE_COOLDOWN,
  MERCAT_VOICE_RADIUS,
  MERCAT_WAYPOINT_RADIUS,
  MERCAT_VOICE_PATH,
  SPEED_BOOST_DURATION,
} from "../constants";
import { useAnimatedModel } from "../hooks/useAnimatedModel";
import { useProximityVoice } from "../hooks/useProximityVoice";

function MercatModel({ paused }: { paused: boolean }) {
  const { clonedScene, animRootRef, walkActionRef } = useAnimatedModel(
    MERCAT_MODEL_PATH,
  );

  useFrame(() => {
    const walkAction = walkActionRef.current;
    if (walkAction) walkAction.paused = paused;
  });

  return (
    <group ref={animRootRef}>
      <primitive object={clonedScene} scale={MERCAT_SCALE} />
    </group>
  );
}

useGLTF.preload(MERCAT_MODEL_PATH);

function pickMercatWaypoint(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * MERCAT_ROAM_RANGE;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

export function Mercat({
  rabbitRef,
  paused,
  onBoost,
}: {
  rabbitRef: RefObject<THREE.Group | null>;
  paused: boolean;
  onBoost: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const waypoint = useRef<[number, number]>(pickMercatWaypoint());
  const cooldownRef = useRef(0);
  const updateVoice = useProximityVoice(MERCAT_VOICE_PATH, {
    radius: MERCAT_VOICE_RADIUS,
    cooldown: MERCAT_VOICE_COOLDOWN,
  });
  const _look = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(MERCAT_SPAWN_X, GROUND_Y, MERCAT_SPAWN_Z);
  }, []);

  useFrame((_, delta) => {
    const cat = groupRef.current;
    const rabbit = rabbitRef.current;
    if (!cat || !rabbit || paused) return;

    if (cooldownRef.current > 0) cooldownRef.current -= delta;

    let mx = cat.position.x;
    let mz = cat.position.z;
    const rx = rabbit.position.x;
    const rz = rabbit.position.z;
    const cdx = rx - mx;
    const cdz = rz - mz;
    if (
      cooldownRef.current <= 0 &&
      cdx * cdx + cdz * cdz < MERCAT_TOUCH_RADIUS * MERCAT_TOUCH_RADIUS
    ) {
      cooldownRef.current = SPEED_BOOST_DURATION + 1;
      onBoost();
    }

    updateVoice(delta, cdx * cdx + cdz * cdz);

    const [wx, wz] = waypoint.current;
    const dx = wx - mx;
    const dz = wz - mz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < MERCAT_WAYPOINT_RADIUS) {
      waypoint.current = pickMercatWaypoint();
      return;
    }

    mx += (dx / dist) * MERCAT_ROAM_SPEED;
    mz += (dz / dist) * MERCAT_ROAM_SPEED;

    cat.position.x = mx;
    cat.position.z = mz;

    _look.set(wx, cat.position.y, wz);
    cat.lookAt(_look);
  });

  return (
    <group ref={groupRef}>
      <MercatModel paused={paused} />
    </group>
  );
}
