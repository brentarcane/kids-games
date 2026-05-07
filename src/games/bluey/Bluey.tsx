"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  BLUEY_FAMILY_MODEL_PATH,
  BLUEY_MODEL_PATH,
  BLUEY_MODEL_YAW,
  BLUEY_SCALE,
  ENTRY_DURATION,
  ENTRY_OFFSET_X,
  ENTRY_OFFSET_Y,
  ENTRY_START_SCALE,
  FACING_LERP,
  FLIP_DURATION,
} from "./constants";
import type { Facing } from "./types";

/**
 * Visual rig for a Bluey-game playable. Two nested groups handle:
 *   - facing: a smoothed yaw around Y so she turns to face her travel direction
 *   - flip:   a rotation around the body-local X axis that performs a forward
 *             roll triggered on double-jump
 *
 * The flip happens in body-local space (inside the yaw group) so the roll
 * always reads as "head over forward feet" regardless of which way she's
 * facing.
 *
 * The model is parameterized: `modelPath` selects which GLB to render, so
 * the same rig drives both Bluey and the swapped-in family model. An
 * outermost `entryGroup` plays a one-shot slide-in animation when
 * `entrySeed` changes (used for the character-swap transition).
 */
export function Bluey({
  facingRef,
  movingRef,
  flipTriggerRef,
  modelPath = BLUEY_MODEL_PATH,
  modelScale = BLUEY_SCALE,
  modelYaw = BLUEY_MODEL_YAW,
  autoFitHeight,
  entrySeed = 0,
}: {
  facingRef: RefObject<Facing>;
  movingRef: RefObject<boolean>;
  /** Increment to start a new flip. */
  flipTriggerRef: RefObject<number>;
  modelPath?: string;
  modelScale?: number;
  modelYaw?: number;
  /** When set, overrides `modelScale`: the model is scaled so its bounding
   *  box height matches this value (in world units). */
  autoFitHeight?: number;
  /** Increment to play the swap-in slide animation. */
  entrySeed?: number;
}) {
  const entryGroup = useRef<THREE.Group>(null);
  const yawGroup = useRef<THREE.Group>(null);
  const flipGroup = useRef<THREE.Group>(null);
  const animRoot = useRef<THREE.Group>(null);

  const { scene, animations: clips } = useGLTF(modelPath);
  // SkeletonUtils.clone properly rebinds skinned meshes to the cloned bones.
  // A plain scene.clone(true) leaves the visible mesh bound to the original
  // (un-mounted, never-moves) bones, which is what caused Bluey to render
  // static at world origin while an "invisible" rig moved with input.
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(clips, animRoot);
  const walkAction = useRef<THREE.AnimationAction | null>(null);

  // Brighten the GLB's materials. Shipped PBR materials look dim under
  // realistic lighting; for a cartoon character we want them to read closer
  // to flat-shaded.
  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const m of mats) {
        if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const std = m as THREE.MeshStandardMaterial;
          std.emissive.copy(std.color);
          if (std.map) std.emissiveMap = std.map;
          std.emissiveIntensity = 0.55;
          std.roughness = 1.0;
          std.metalness = 0.0;
          std.needsUpdate = true;
        }
      }
    });
  }, [cloned]);

  // Effective scale. When autoFitHeight is set, derive scale from the model's
  // natural bounding-box height so different GLBs end up visually consistent.
  const effectiveScale = useMemo(() => {
    if (autoFitHeight === undefined) return modelScale;
    const probe = cloned.clone(true);
    probe.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(probe);
    const naturalHeight = box.max.y - box.min.y;
    if (!Number.isFinite(naturalHeight) || naturalHeight <= 0)
      return modelScale;
    return autoFitHeight / naturalHeight;
  }, [cloned, autoFitHeight, modelScale]);

  // Position the model so its lowest point sits at y=0 in local space,
  // regardless of where the mesh sits relative to its origin (some rigs are
  // authored with feet at origin, others with origin at the floor or even
  // below the mesh — we always shift to ground).
  const footLift = useMemo(() => {
    const probe = new THREE.Group();
    const yawed = new THREE.Group();
    yawed.rotation.y = modelYaw;
    const inner = cloned.clone(true);
    inner.scale.setScalar(effectiveScale);
    yawed.add(inner);
    probe.add(yawed);
    probe.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(probe);
    return -box.min.y + 0.02;
  }, [cloned, effectiveScale, modelYaw]);

  useEffect(() => {
    if (clips.length === 0) return;
    const clip =
      clips.find((c) => /run|walk|jog|locomot/i.test(c.name)) ??
      clips.find((c) => /idle/i.test(c.name)) ??
      clips[0];
    const action = clip ? actions[clip.name] : undefined;
    if (!action) return;
    action.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play();
    walkAction.current = action;
    return () => {
      action.stop();
      walkAction.current = null;
    };
  }, [actions, clips]);

  // Flip state — rising-edge driven by flipTriggerRef
  const lastFlipTrigger = useRef(0);
  const flipElapsed = useRef(0);
  const flipping = useRef(false);

  // Entry slide-in state — rising-edge driven by entrySeed.
  // If we mount with entrySeed > 0 (a swap remounted us), play the slide-in
  // immediately; the very first mount on game load (entrySeed === 0) skips it.
  const lastEntrySeed = useRef(entrySeed);
  const entryElapsed = useRef(entrySeed > 0 ? 0 : ENTRY_DURATION);

  useFrame((_, delta) => {
    const yaw = yawGroup.current;
    const flip = flipGroup.current;
    const entry = entryGroup.current;
    if (!yaw || !flip || !entry) return;

    // ─── Entry slide-in (rising edge on entrySeed) ───────────────────────
    if (entrySeed !== lastEntrySeed.current) {
      lastEntrySeed.current = entrySeed;
      entryElapsed.current = 0;
    }

    if (entryElapsed.current < ENTRY_DURATION) {
      entryElapsed.current = Math.min(
        ENTRY_DURATION,
        entryElapsed.current + delta,
      );
      const t = entryElapsed.current / ENTRY_DURATION;
      const eased = 1 - (1 - t) ** 3; // ease-out cubic
      const inv = 1 - eased;
      entry.position.set(ENTRY_OFFSET_X * inv, ENTRY_OFFSET_Y * inv, 0);
      entry.scale.setScalar(
        ENTRY_START_SCALE + (1 - ENTRY_START_SCALE) * eased,
      );
    } else if (entry.position.lengthSq() !== 0 || entry.scale.x !== 1) {
      // Snap to rest pose once finished
      entry.position.set(0, 0, 0);
      entry.scale.setScalar(1);
    }

    // ─── Facing ──────────────────────────────────────────────────────────
    const targetYaw =
      facingRef.current === "right" ? -Math.PI / 2 : Math.PI / 2;
    let dy = targetYaw - yaw.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    yaw.rotation.y += dy * Math.min(1, delta * FACING_LERP);

    // ─── Flip trigger (rising edge on flipTriggerRef) ────────────────────
    if (flipTriggerRef.current !== lastFlipTrigger.current) {
      lastFlipTrigger.current = flipTriggerRef.current;
      flipping.current = true;
      flipElapsed.current = 0;
    }

    if (flipping.current) {
      flipElapsed.current += delta;
      const t = Math.min(flipElapsed.current / FLIP_DURATION, 1);
      // Forward roll: rotate the opposite way around body-local X. The
      // negation works for both facings because flipGroup's local X axis
      // mirrors with the parent yaw, so a single sign produces a forward
      // (head-over-forward-feet) roll regardless of travel direction.
      flip.rotation.x = -t * Math.PI * 2;
      if (t >= 1) {
        flipping.current = false;
        flip.rotation.x = 0;
      }
    } else {
      // Smoothly settle any residual rotation
      flip.rotation.x *= 0.7;
    }

    // ─── Walk animation gating ───────────────────────────────────────────
    const action = walkAction.current;
    if (action) action.paused = !movingRef.current;
  });

  return (
    <group ref={entryGroup}>
      <group ref={yawGroup}>
        <group ref={flipGroup}>
          <group position={[0, footLift, 0]}>
            <group ref={animRoot} rotation={[0, modelYaw, 0]}>
              <primitive object={cloned} scale={effectiveScale} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(BLUEY_MODEL_PATH);
useGLTF.preload(BLUEY_FAMILY_MODEL_PATH);
