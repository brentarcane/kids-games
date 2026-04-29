"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { BG_MUSIC_PATH, CARROT_COUNT } from "./constants";
import { Scene } from "./Scene";
import type { Carrot, Star } from "./types";
import { GameOverOverlay } from "./ui/GameOverOverlay";
import { HUD } from "./ui/HUD";
import { PauseOverlay } from "./ui/PauseOverlay";
import { WORLD } from "./world-gen";

export default function Game() {
  const [carrots, setCarrots] = useState<Carrot[]>(() =>
    WORLD.carrots.map((c) => ({ ...c })),
  );
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showMeshLabels, setShowMeshLabels] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [rodPickedUp, setRodPickedUp] = useState(false);
  const [rodDelivered, setRodDelivered] = useState(false);
  const [fishFound, setFishFound] = useState(false);
  const [stars, setStars] = useState<Star[]>(() =>
    WORLD.stars.map((s) => ({ ...s })),
  );

  const collectedCount = carrots.filter((c) => c.collected).length;
  const starsCollected = stars.filter((s) => s.collected).length;

  const onCollectCarrot = useCallback((id: number) => {
    setCarrots((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collected: true } : c)),
    );
  }, []);

  const onCaught = useCallback(() => setGameOver(true), []);
  const onPickUpRod = useCallback(() => setRodPickedUp(true), []);
  const onDeliverRod = useCallback(() => setRodDelivered(true), []);
  const onFindFish = useCallback(() => setFishFound(true), []);
  const onCollectStar = useCallback((id: number) => {
    setStars((prev) =>
      prev.map((s) => (s.id === id ? { ...s, collected: true } : s)),
    );
  }, []);

  const restart = useCallback(() => {
    setGameOver(false);
    setCarrots(WORLD.carrots.map((c) => ({ ...c })));
    setRodPickedUp(false);
    setRodDelivered(false);
    setFishFound(false);
    setStars(WORLD.stars.map((s) => ({ ...s })));
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
      <Canvas camera={{ fov: 60, near: 0.1, far: 500, position: [0, 5, 10] }}>
        <Scene
          key={sceneKey}
          carrots={carrots}
          onCollectCarrot={onCollectCarrot}
          paused={paused || gameOver}
          gameOver={gameOver}
          onCaught={onCaught}
          showMeshLabels={showMeshLabels}
          rodPickedUp={rodPickedUp}
          rodDelivered={rodDelivered}
          onPickUpRod={onPickUpRod}
          onDeliverRod={onDeliverRod}
          fishFound={fishFound}
          onFindFish={onFindFish}
          stars={stars}
          onCollectStar={onCollectStar}
        />
      </Canvas>
      <HUD
        collected={collectedCount}
        total={CARROT_COUNT}
        showMeshLabels={showMeshLabels}
        rodPickedUp={rodPickedUp}
        rodDelivered={rodDelivered}
        fishFound={fishFound}
        starsCollected={starsCollected}
      />
      {gameOver && <GameOverOverlay onRestart={restart} />}
      {paused && !gameOver && (
        <PauseOverlay onResume={() => setPaused(false)} />
      )}
    </div>
  );
}
