import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  PROC_WALK_BOB_Y,
  PROC_WALK_FREQ,
  PROC_WALK_PITCH,
  PROC_WALK_ROLL,
} from "../constants";

type CloneMethod = "basic" | "skeleton";

/**
 * Loads a GLB model, clones it, auto-plays a walk/idle animation clip,
 * and falls back to procedural walk bobbing when no clips exist.
 *
 * Returns { clonedScene, animRootRef, walkActionRef, hasGltfClips }
 * so callers can pause/unpause or layer extra logic on top.
 */
export function useAnimatedModel(
  modelPath: string,
  opts: { clone?: CloneMethod } = {},
) {
  const { scene, animations: gltfClips } = useGLTF(modelPath);
  const animRootRef = useRef<THREE.Group>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkPhase = useRef(0);

  const cloneMethod = opts.clone ?? "basic";
  const clonedScene = useMemo(
    () =>
      cloneMethod === "skeleton"
        ? SkeletonUtils.clone(scene)
        : scene.clone(true),
    [scene, cloneMethod],
  );

  const hasGltfClips = gltfClips.length > 0;
  const { actions } = useAnimations(gltfClips, animRootRef);

  useEffect(() => {
    if (!hasGltfClips) return;
    const clip =
      gltfClips.find((c) => /walk|run|jog|locomot/i.test(c.name)) ??
      gltfClips.find((c) => /idle/i.test(c.name)) ??
      gltfClips[0];
    const action = clip ? actions[clip.name] : undefined;
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    walkActionRef.current = action;
    return () => {
      action.stop();
      walkActionRef.current = null;
    };
  }, [actions, gltfClips, hasGltfClips]);

  /** Procedural walk fallback — call each frame when model has no clips. */
  useFrame((_, delta) => {
    const root = animRootRef.current;
    if (!root || hasGltfClips) return;
    walkPhase.current += delta * PROC_WALK_FREQ;
    const ph = walkPhase.current;
    root.rotation.z = Math.sin(ph) * PROC_WALK_ROLL;
    root.rotation.x = Math.sin(ph * 2) * PROC_WALK_PITCH;
    root.position.y = Math.abs(Math.sin(ph * 2)) * PROC_WALK_BOB_Y;
  });

  return { clonedScene, animRootRef, walkActionRef, hasGltfClips };
}
