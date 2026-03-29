"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { BG_MUSIC_PATH, CARROT_COUNT } from "./game/constants";
import type { Carrot } from "./game/types";
import { WORLD } from "./game/world-gen";
import { Scene } from "./game/Scene";
import { HUD } from "./game/ui/HUD";
import { GameOverOverlay } from "./game/ui/GameOverOverlay";
import { PauseOverlay } from "./game/ui/PauseOverlay";

export default function Game() {
  const [carrots, setCarrots] = useState<Carrot[]>(() =>
    WORLD.carrots.map((c) => ({ ...c })),
  );
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showMeshLabels, setShowMeshLabels] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  const collectedCount = carrots.filter((c) => c.collected).length;

  const onCollectCarrot = useCallback((id: number) => {
    setCarrots((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c)),
    );
  }, []);

  const onCaught = useCallback(() => setGameOver(true), []);

  const restart = useCallback(() => {
    setGameOver(false);
    setCarrots(WORLD.carrots.map((c) => ({ ...c })));
    setSceneKey((k) => k + 1);
  }, []);

  // Background music — starts on first user interaction, loops quietly
  useEffect(() => {
    const music = new Audio(BG_MUSIC_PATH);
    music.loop = true;
    music.volume = 0.35;
    const startMusic = () => {
      music.play().catch(() => {});
      window.removeEventListener("click", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
    window.addEventListener("click", startMusic);
    window.addEventListener("keydown", startMusic);
    return () => {
      music.pause();
      window.removeEventListener("click", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === "m" || e.key === "M") {
        if (e.repeat) return;
        e.preventDefault();
        setShowMeshLabels((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 500, position: [0, 5, 10] }}
      >
        <Scene
          key={sceneKey}
          carrots={carrots}
          onCollectCarrot={onCollectCarrot}
          paused={paused || gameOver}
          gameOver={gameOver}
          onCaught={onCaught}
          showMeshLabels={showMeshLabels}
        />
      </Canvas>
      <HUD
        collected={collectedCount}
        total={CARROT_COUNT}
        showMeshLabels={showMeshLabels}
      />
      {gameOver && <GameOverOverlay onRestart={restart} />}
      {paused && !gameOver && (
        <PauseOverlay onResume={() => setPaused(false)} />
      )}
    </div>
  );
}
