"use client";

import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Bluey } from "./bluey";
import { CameraFollow } from "./camera-follow";
import {
  AIR_CONTROL,
  BLUEY_FAMILY_MODEL_PATH,
  BLUEY_FAMILY_MODEL_YAW,
  BLUEY_FAMILY_TARGET_HEIGHT,
  BLUEY_MODEL_PATH,
  BLUEY_MODEL_YAW,
  BLUEY_SCALE,
  DOUBLE_JUMP_VELOCITY,
  FALL_THRESHOLD,
  FINISH_DETECT_RADIUS,
  GRAVITY,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  RUN_SPEED,
  SPAWN_X,
  SPAWN_Y,
} from "./constants";
import { Background } from "./environment/background";
import { Finish } from "./environment/finish";
import { Platform } from "./environment/platform";
import type { Facing, LevelLayout } from "./types";

type Keys = { left: boolean; right: boolean; space: boolean };

export function Scene({
  level,
  paused,
  won,
  onFall,
  onWin,
  livesRef,
}: {
  level: LevelLayout;
  paused: boolean;
  won: boolean;
  onFall: () => void;
  onWin: () => void;
  /** For HUD display only — incremented every fall. */
  livesRef: RefObject<number>;
}) {
  const blueyGroup = useRef<THREE.Group>(null);

  // Physics state lives in refs so it survives re-renders without re-triggering useFrame
  const pos = useRef(new THREE.Vector3(SPAWN_X, SPAWN_Y, 0));
  const vel = useRef(new THREE.Vector3());
  const grounded = useRef(false);
  const jumpsUsed = useRef(0); // 0 = on ground, 1 = jumped, 2 = double jumped
  const facingRef = useRef<Facing>("right");
  const movingRef = useRef(false);
  const flipTriggerRef = useRef(0);

  // Character swap state. `entrySeed` rises every swap so the model plays
  // its slide-in animation from the top-left of the viewport.
  const [character, setCharacter] = useState<"bluey" | "family">("bluey");
  const [entrySeed, setEntrySeed] = useState(0);

  const keys = useRef<Keys>({ left: false, right: false, space: false });
  const spaceWasPressed = useRef(false);

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === " ") {
        e.preventDefault();
        keys.current.space = true;
      }
      if (e.key === "f" || e.key === "F") {
        setCharacter((c) => (c === "bluey" ? "family" : "bluey"));
        setEntrySeed((s) => s + 1);
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === " ") keys.current.space = false;
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const g = blueyGroup.current;
    if (!g || paused || won) return;

    // Clamp huge frames (tab refocus etc.) so physics stays sane
    const dt = Math.min(rawDelta, 1 / 30);

    const k = keys.current;

    // ─── Horizontal input ────────────────────────────────────────────────
    let dir = 0;
    if (k.left) dir -= 1;
    if (k.right) dir += 1;
    movingRef.current = dir !== 0 && grounded.current;
    if (dir !== 0) {
      facingRef.current = dir > 0 ? "right" : "left";
    }
    const horiz = grounded.current ? RUN_SPEED : RUN_SPEED * AIR_CONTROL;
    vel.current.x = dir * horiz;

    // ─── Jump (rising edge on space) ─────────────────────────────────────
    if (k.space && !spaceWasPressed.current) {
      if (grounded.current && jumpsUsed.current === 0) {
        vel.current.y = JUMP_VELOCITY;
        jumpsUsed.current = 1;
        grounded.current = false;
      } else if (jumpsUsed.current === 1) {
        vel.current.y = DOUBLE_JUMP_VELOCITY;
        jumpsUsed.current = 2;
        flipTriggerRef.current += 1; // tells <Bluey> to start a forward roll
      }
    }
    spaceWasPressed.current = k.space;

    // ─── Gravity ─────────────────────────────────────────────────────────
    vel.current.y -= GRAVITY * dt;
    if (vel.current.y < -MAX_FALL_SPEED) vel.current.y = -MAX_FALL_SPEED;

    // ─── Integrate ───────────────────────────────────────────────────────
    const prevY = pos.current.y;
    pos.current.x += vel.current.x * dt;
    pos.current.y += vel.current.y * dt;

    // ─── Platform landing collision ──────────────────────────────────────
    grounded.current = false;
    if (vel.current.y <= 0) {
      for (const p of level.platforms) {
        const onX = pos.current.x >= p.x && pos.current.x <= p.x + p.width;
        if (!onX) continue;
        // Crossed the platform top this frame, going downward
        if (prevY >= p.y - 0.001 && pos.current.y <= p.y) {
          pos.current.y = p.y;
          vel.current.y = 0;
          grounded.current = true;
          jumpsUsed.current = 0;
          break;
        }
      }
    }

    // ─── Fall hazard ─────────────────────────────────────────────────────
    if (pos.current.y < FALL_THRESHOLD) {
      pos.current.set(SPAWN_X, SPAWN_Y, 0);
      vel.current.set(0, 0, 0);
      grounded.current = false;
      jumpsUsed.current = 0;
      livesRef.current += 1;
      onFall();
      return;
    }

    // ─── Finish detection ────────────────────────────────────────────────
    const dx = pos.current.x - level.finish.x;
    const dy = pos.current.y - (level.finish.y + 1);
    if (dx * dx + dy * dy < FINISH_DETECT_RADIUS * FINISH_DETECT_RADIUS) {
      onWin();
    }

    // ─── Push to scene graph ─────────────────────────────────────────────
    g.position.copy(pos.current);
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      {/* Sky/ground hemisphere fill — softens shadows on Bluey's fur and
          generally lifts the model out of the dark. */}
      <hemisphereLight args={["#bfe6ff", "#a4d18a", 0.9]} />
      <directionalLight position={[20, 40, 25]} intensity={1.4} castShadow />

      <Background />

      {level.platforms.map((p) => (
        <Platform key={p.id} platform={p} />
      ))}

      <Finish x={level.finish.x} y={level.finish.y} />

      <group ref={blueyGroup} position={[SPAWN_X, SPAWN_Y, 0]}>
        <Bluey
          // Remount the rig on swap so useGLTF re-resolves the new GLB and
          // the animation mixer rebinds cleanly to the new skeleton.
          key={character}
          facingRef={facingRef}
          movingRef={movingRef}
          flipTriggerRef={flipTriggerRef}
          modelPath={
            character === "family" ? BLUEY_FAMILY_MODEL_PATH : BLUEY_MODEL_PATH
          }
          modelScale={BLUEY_SCALE}
          modelYaw={
            character === "family" ? BLUEY_FAMILY_MODEL_YAW : BLUEY_MODEL_YAW
          }
          autoFitHeight={
            character === "family" ? BLUEY_FAMILY_TARGET_HEIGHT : undefined
          }
          entrySeed={entrySeed}
        />
      </group>

      <CameraFollow target={blueyGroup} facingRef={facingRef} />
    </>
  );
}
