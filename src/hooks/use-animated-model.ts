import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

type CloneMethod = "basic" | "skeleton";

type ProcWalk = { freq: number; roll: number; pitch: number; bobY: number };

const DEFAULT_PROC_WALK: ProcWalk = {
  freq: 10,
  roll: 0.07,
  pitch: 0.05,
  bobY: 0.04,
};

/**
 * Loads a GLB model, clones it, auto-plays a walk/idle animation clip,
 * and falls back to procedural walk bobbing when no clips exist.
 *
 * Returns { clonedScene, animRootRef, walkActionRef, hasGltfClips }
 * so callers can pause/unpause or layer extra logic on top.
 */
export function useAnimatedModel(
  modelPath: string,
  opts: { clone?: CloneMethod; procWalk?: Partial<ProcWalk> } = {},
) {
  const procWalk = { ...DEFAULT_PROC_WALK, ...opts.procWalk };
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
    walkPhase.current += delta * procWalk.freq;
    const ph = walkPhase.current;
    root.rotation.z = Math.sin(ph) * procWalk.roll;
    root.rotation.x = Math.sin(ph * 2) * procWalk.pitch;
    root.position.y = Math.abs(Math.sin(ph * 2)) * procWalk.bobY;
  });

  return { clonedScene, animRootRef, walkActionRef, hasGltfClips };
}
