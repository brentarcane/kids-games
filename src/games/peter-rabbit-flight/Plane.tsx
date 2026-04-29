"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  PILOT_MODEL_PATH,
  PILOT_OFFSET,
  PILOT_SCALE,
  PILOT_YAW,
  PLANE_MODEL_PATH,
  PLANE_MODEL_YAW,
  PLANE_SCALE,
} from "./constants";

/**
 * Walks the loaded plane scene to find the shallowest node that has any
 * animation track targeting it. That's almost always the "body" / "root"
 * node — the thing that gives the plane its overall sway. Returns null if
 * nothing animated could be found.
 */
function findSwayingNode(
  scene: THREE.Object3D,
  clips: THREE.AnimationClip[],
): THREE.Object3D | null {
  let best: { node: THREE.Object3D; depth: number } | null = null;
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const dotIdx = track.name.indexOf(".");
      if (dotIdx <= 0) continue;
      const nodeName = track.name.slice(0, dotIdx);
      const node = scene.getObjectByName(nodeName);
      if (!node) continue;
      // Compute depth from scene root
      let depth = 0;
      let cur: THREE.Object3D | null = node;
      while (cur && cur !== scene) {
        depth++;
        cur = cur.parent;
      }
      if (!best || depth < best.depth) {
        best = { node, depth };
      }
    }
  }
  return best?.node ?? null;
}

export function Plane() {
  const planeRef = useRef<THREE.Group>(null);
  const pilotAnchorRef = useRef<THREE.Group>(null);
  const { scene: planeScene, animations: planeClips } =
    useGLTF(PLANE_MODEL_PATH);
  const { scene: pilotScene } = useGLTF(PILOT_MODEL_PATH);

  const planeClone = useMemo(() => planeScene.clone(true), [planeScene]);
  const pilotClone = useMemo(() => pilotScene.clone(true), [pilotScene]);

  const { actions } = useAnimations(planeClips, planeRef);

  useEffect(() => {
    if (planeClips.length === 0) return;
    const playing: THREE.AnimationAction[] = [];
    for (const clip of planeClips) {
      const action = actions[clip.name];
      if (!action) continue;
      action.reset().setLoop(THREE.LoopRepeat, Infinity).play();
      playing.push(action);
    }
    return () => {
      for (const action of playing) action.stop();
    };
  }, [actions, planeClips]);

  // Pin Peter to whatever bone/node the plane's sway animation targets.
  // attach() preserves world transform so PILOT_OFFSET stays meaningful.
  useEffect(() => {
    const anchor = pilotAnchorRef.current;
    if (!anchor) return;
    const swayNode = findSwayingNode(planeClone, planeClips);
    if (!swayNode) return;
    const originalParent = anchor.parent;
    swayNode.attach(anchor);
    return () => {
      if (originalParent) originalParent.attach(anchor);
    };
  }, [planeClone, planeClips]);

  return (
    <group>
      <group ref={planeRef} rotation={[0, PLANE_MODEL_YAW, 0]} scale={PLANE_SCALE}>
        <primitive object={planeClone} />
      </group>
      {/* Pilot starts as a sibling of the plane group so its transform is in
          world units. After mount it gets reparented to the swaying node via
          Object3D.attach(), which preserves world transform. */}
      <group
        ref={pilotAnchorRef}
        position={PILOT_OFFSET}
        rotation={[0, PILOT_YAW, 0]}
        scale={PILOT_SCALE}
      >
        <primitive object={pilotClone} />
      </group>
    </group>
  );
}

useGLTF.preload(PLANE_MODEL_PATH);
useGLTF.preload(PILOT_MODEL_PATH);
