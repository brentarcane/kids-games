"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { Color, Fog } from "three";
import { FOG_FAR, FOG_NEAR, RING_COUNT, SKY_COLOR } from "./constants";
import { Scene } from "./Scene";
import type { Ring as RingType } from "./types";
import { HUD } from "./ui/HUD";
import { PauseOverlay } from "./ui/PauseOverlay";
import { WinOverlay } from "./ui/WinOverlay";
import { COURSE } from "./world-gen";

export default function Game() {
  const [rings, setRings] = useState<RingType[]>(() =>
    COURSE.rings.map((r) => ({ ...r })),
  );
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const [boostActive, setBoostActive] = useState(false);

  const elapsedRef = useRef(0);
  const boostActiveRef = useRef(false);

  const passedCount = rings.filter((r) => r.passed).length;
  const activeRing = rings.find((r) => !r.passed);
  const activeRingId = activeRing?.id ?? -1;

  const onPassRing = useCallback((id: number) => {
    setRings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, passed: true } : r)),
    );
  }, []);

  // Win when all rings passed
  useEffect(() => {
    if (passedCount === RING_COUNT && !won) {
      setWon(true);
    }
  }, [passedCount, won]);

  // Pull elapsed/boost into React state at 10fps for HUD
  useEffect(() => {
    if (paused || won) return;
    const id = setInterval(() => {
      setDisplayElapsed(elapsedRef.current);
      setBoostActive(boostActiveRef.current);
    }, 100);
    return () => clearInterval(id);
  }, [paused, won]);

  const restart = useCallback(() => {
    elapsedRef.current = 0;
    boostActiveRef.current = false;
    setDisplayElapsed(0);
    setBoostActive(false);
    setWon(false);
    setRings(COURSE.rings.map((r) => ({ ...r })));
    setSceneKey((k) => k + 1);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // If pointer lock is active, ESC releases it; don't also pause.
        if (document.pointerLockElement) return;
        e.preventDefault();
        setPaused((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black">
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 1000, position: [0, 35, 30] }}
        onCreated={({ scene }) => {
          scene.background = new Color(SKY_COLOR);
          scene.fog = new Fog(SKY_COLOR, FOG_NEAR, FOG_FAR);
        }}
      >
        <Scene
          key={sceneKey}
          rings={rings}
          activeRingId={activeRingId}
          paused={paused || won}
          won={won}
          elapsedRef={elapsedRef}
          onPassRing={onPassRing}
          boostActiveRef={boostActiveRef}
        />
      </Canvas>
      <HUD
        passed={passedCount}
        total={RING_COUNT}
        elapsed={displayElapsed}
        boostActive={boostActive}
      />
      {won && <WinOverlay elapsed={elapsedRef.current} onRestart={restart} />}
      {paused && !won && (
        <PauseOverlay onResume={() => setPaused(false)} />
      )}
    </div>
  );
}
