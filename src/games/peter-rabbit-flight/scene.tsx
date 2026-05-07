"use client";

import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { CameraFollow } from "./camera-follow";
import { Ring } from "./collectibles/ring";
import {
  PITCH_LIMIT,
  PITCH_RATE,
  PLANE_BOOST_DURATION,
  PLANE_BOOST_MULT,
  PLANE_SPEED,
  RING_DETECT_RADIUS,
  ROLL_LERP,
  ROLL_VISUAL_MAX,
  YAW_RATE,
} from "./constants";
import { Clouds } from "./environment/clouds";
import { Ground } from "./environment/ground";
import { Plane } from "./plane";
import type { Ring as RingType } from "./types";

type Keys = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  space: boolean;
};

export function Scene({
  rings,
  activeRingId,
  paused,
  won,
  elapsedRef,
  onPassRing,
  boostActiveRef,
}: {
  rings: RingType[];
  activeRingId: number;
  paused: boolean;
  won: boolean;
  elapsedRef: RefObject<number>;
  onPassRing: (id: number) => void;
  boostActiveRef: RefObject<boolean>;
}) {
  const planeGroup = useRef<THREE.Group>(null);
  const planeVisual = useRef<THREE.Group>(null); // for banking roll
  const yaw = useRef(0);
  const pitch = useRef(0);
  const visualRoll = useRef(0);
  const boostTimer = useRef(0);

  const keys = useRef<Keys>({
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
  });
  const spaceWasPressed = useRef(false);

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keys.current.left = true;
      if (e.key === "ArrowRight") keys.current.right = true;
      if (e.key === "ArrowUp") keys.current.up = true;
      if (e.key === "ArrowDown") keys.current.down = true;
      if (e.key === " ") {
        e.preventDefault();
        keys.current.space = true;
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keys.current.left = false;
      if (e.key === "ArrowRight") keys.current.right = false;
      if (e.key === "ArrowUp") keys.current.up = false;
      if (e.key === "ArrowDown") keys.current.down = false;
      if (e.key === " ") keys.current.space = false;
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useFrame((_, delta) => {
    const plane = planeGroup.current;
    const visual = planeVisual.current;
    if (!plane || !visual || paused || won) return;

    elapsedRef.current += delta;

    const k = keys.current;

    // Boost trigger on space press (rising edge)
    if (k.space && !spaceWasPressed.current && boostTimer.current <= 0) {
      boostTimer.current = PLANE_BOOST_DURATION;
    }
    spaceWasPressed.current = k.space;
    if (boostTimer.current > 0) boostTimer.current -= delta;
    const boosting = boostTimer.current > 0;
    boostActiveRef.current = boosting;

    // Pitch (up arrow = climb = pitch nose up = +X rotation in three.js
    // since plane forward is -Z, positive pitch around X tips nose up)
    if (k.up) pitch.current += PITCH_RATE * delta;
    if (k.down) pitch.current -= PITCH_RATE * delta;
    pitch.current = THREE.MathUtils.clamp(
      pitch.current,
      -PITCH_LIMIT,
      PITCH_LIMIT,
    );

    // Yaw (turning)
    let turn = 0;
    if (k.left) turn += 1;
    if (k.right) turn -= 1;
    yaw.current += turn * YAW_RATE * delta;

    // Apply rotation: yaw then pitch (Y then X order, "YXZ" euler)
    plane.rotation.order = "YXZ";
    plane.rotation.y = yaw.current;
    plane.rotation.x = pitch.current;

    // Visual bank roll on the inner group (doesn't affect movement direction)
    const targetRoll = turn * ROLL_VISUAL_MAX;
    visualRoll.current +=
      (targetRoll - visualRoll.current) * Math.min(1, delta * ROLL_LERP);
    visual.rotation.z = visualRoll.current;

    // Forward velocity in world space
    const speed = PLANE_SPEED * (boosting ? PLANE_BOOST_MULT : 1);
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(plane.rotation);
    plane.position.addScaledVector(fwd, speed * delta);

    // Soft floor — keep plane above ground
    if (plane.position.y < 1) {
      plane.position.y = 1;
      pitch.current = Math.max(pitch.current, 0);
    }

    // Active ring detection
    const activeRing = rings.find((r) => r.id === activeRingId);
    if (activeRing) {
      const dx = plane.position.x - activeRing.x;
      const dy = plane.position.y - activeRing.y;
      const dz = plane.position.z - activeRing.z;
      if (
        dx * dx + dy * dy + dz * dz <
        RING_DETECT_RADIUS * RING_DETECT_RADIUS
      ) {
        onPassRing(activeRing.id);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[50, 100, 50]} intensity={1.0} />

      <Ground />
      <Clouds />

      {rings.map((r) => (
        <Ring key={r.id} ring={r} active={r.id === activeRingId} />
      ))}

      <group ref={planeGroup} position={[0, 30, 0]}>
        <group ref={planeVisual}>
          <Plane />
        </group>
      </group>

      <CameraFollow target={planeGroup} />
    </>
  );
}
