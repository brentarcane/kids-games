"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CAMERA_LEAD_LERP,
  CAMERA_LERP,
  CAMERA_LOOK_AHEAD,
  CAMERA_MIN_Y,
  CAMERA_Y_OFFSET,
  CAMERA_Z,
} from "./constants";
import type { Facing } from "./types";

/**
 * Side-on follow cam for the 2.5D scroller. Sits on +Z looking at the
 * X/Y action plane and leads Bluey slightly in her facing direction
 * so the player has more visibility of what's coming.
 */
export function CameraFollow({
  target,
  facingRef,
}: {
  target: RefObject<THREE.Group | null>;
  facingRef: RefObject<Facing>;
}) {
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  // Smoothed lead-ahead: re-targets gradually when facing flips so the
  // camera doesn't whip-pan as Bluey reverses direction.
  const smoothedLead = useRef(CAMERA_LOOK_AHEAD);

  useFrame((_, delta) => {
    const t = target.current;
    if (!t) return;
    const targetLead =
      facingRef.current === "right" ? CAMERA_LOOK_AHEAD : -CAMERA_LOOK_AHEAD;
    smoothedLead.current +=
      (targetLead - smoothedLead.current) *
      Math.min(1, delta * CAMERA_LEAD_LERP);
    const lead = smoothedLead.current;
    desired.set(
      t.position.x + lead,
      Math.max(t.position.y + CAMERA_Y_OFFSET, CAMERA_MIN_Y),
      CAMERA_Z,
    );
    camera.position.lerp(desired, CAMERA_LERP);
    lookAt.set(t.position.x + lead, Math.max(t.position.y + 0.5, 1), 0);
    camera.lookAt(lookAt);
  });

  return null;
}
