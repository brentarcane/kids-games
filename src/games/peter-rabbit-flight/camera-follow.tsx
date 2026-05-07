"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CAMERA_BACK,
  CAMERA_LERP,
  CAMERA_UP,
  ORBIT_DISTANCE,
  ORBIT_PITCH_LIMIT,
  ORBIT_SENSITIVITY,
} from "./constants";

/**
 * Default chase cam, plus a GTA-style orbit mode triggered by clicking the
 * canvas (pointer lock). Mouse rotates the camera around the plane while
 * locked; ESC releases the lock and snaps back to the chase view.
 */
export function CameraFollow({
  target,
}: {
  target: RefObject<THREE.Group | null>;
}) {
  const { camera, gl } = useThree();
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);

  // Orbit state — driven by mouse deltas while pointer lock is active
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0.2);
  const isLocked = useRef(false);

  useEffect(() => {
    const dom = gl.domElement;

    function onPointerDown() {
      if (!isLocked.current) {
        dom.requestPointerLock?.();
      }
    }

    function onLockChange() {
      const locked = document.pointerLockElement === dom;
      isLocked.current = locked;
      if (locked) {
        // Initialize orbit so the camera doesn't jump — start from where the
        // chase cam currently is (behind the plane).
        const plane = target.current;
        if (plane) {
          orbitYaw.current = plane.rotation.y + Math.PI;
          orbitPitch.current = 0.2;
        }
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (!isLocked.current) return;
      orbitYaw.current -= e.movementX * ORBIT_SENSITIVITY;
      orbitPitch.current -= e.movementY * ORBIT_SENSITIVITY;
      orbitPitch.current = THREE.MathUtils.clamp(
        orbitPitch.current,
        -ORBIT_PITCH_LIMIT,
        ORBIT_PITCH_LIMIT,
      );
    }

    dom.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [gl, target]);

  useFrame(() => {
    const plane = target.current;
    if (!plane) return;

    if (isLocked.current) {
      const yaw = orbitYaw.current;
      const pitch = orbitPitch.current;
      const cosP = Math.cos(pitch);
      camPos.set(
        plane.position.x + Math.sin(yaw) * cosP * ORBIT_DISTANCE,
        plane.position.y + Math.sin(pitch) * ORBIT_DISTANCE,
        plane.position.z + Math.cos(yaw) * cosP * ORBIT_DISTANCE,
      );
      camera.position.lerp(camPos, CAMERA_LERP);
      lookAt.copy(plane.position);
      camera.lookAt(lookAt);
    } else {
      forward.set(0, 0, -1).applyQuaternion(plane.quaternion);
      camPos.copy(plane.position);
      camPos.addScaledVector(forward, -CAMERA_BACK);
      camPos.y += CAMERA_UP;
      camera.position.lerp(camPos, CAMERA_LERP);
      lookAt.copy(plane.position).addScaledVector(forward, 5);
      camera.lookAt(lookAt);
    }
  });

  return null;
}
