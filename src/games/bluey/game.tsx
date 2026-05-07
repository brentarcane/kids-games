"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { Color, Fog } from "three";
import { MessageOverlay } from "@/components/message-overlay";
import { PauseOverlay } from "@/components/pause-overlay";
import { FOG_FAR, FOG_NEAR, SKY_COLOR } from "./constants";
import { Scene } from "./scene";
import { HUD } from "./ui/hud";
import { LEVEL } from "./world-gen";

export default function Game() {
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [displayFalls, setDisplayFalls] = useState(0);

  const fallsRef = useRef(0);

  const onFall = useCallback(() => {
    setDisplayFalls(fallsRef.current);
  }, []);

  const onWin = useCallback(() => {
    setWon(true);
  }, []);

  const restart = useCallback(() => {
    fallsRef.current = 0;
    setDisplayFalls(0);
    setWon(false);
    setSceneKey((k) => k + 1);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-sky-300">
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 500, position: [0, 6, 18] }}
        onCreated={({ scene }) => {
          scene.background = new Color(SKY_COLOR);
          scene.fog = new Fog(SKY_COLOR, FOG_NEAR, FOG_FAR);
        }}
      >
        <Scene
          key={sceneKey}
          level={LEVEL}
          paused={paused || won}
          won={won}
          onFall={onFall}
          onWin={onWin}
          livesRef={fallsRef}
        />
      </Canvas>

      <HUD falls={displayFalls} />

      {won && (
        <MessageOverlay
          title="You made it!"
          italic
          body={`Falls: ${fallsRef.current}`}
          actionLabel="Play Again"
          onAction={restart}
          accent="sky"
        />
      )}
      {paused && !won && <PauseOverlay onResume={() => setPaused(false)} />}
    </div>
  );
}
