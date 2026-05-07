"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { MessageOverlay } from "@/components/message-overlay";
import { PauseOverlay } from "@/components/pause-overlay";
import { BG_MUSIC_PATH, CARROT_COUNT } from "./constants";
import { Scene } from "./scene";
import type { Carrot, Star } from "./types";
import { HUD } from "./ui/hud";
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
      {gameOver && (
        <MessageOverlay
          title="Caught by Mr. McGregor!"
          titleClassName="text-red-800"
          body="Peter should have stayed out of the garden..."
          actionLabel="Try Again"
          onAction={restart}
          accent="amber"
          buttonClassName="bg-green-600 hover:bg-green-700"
        />
      )}
      {paused && !gameOver && (
        <PauseOverlay
          onResume={() => setPaused(false)}
          accent="amber"
          body="Peter is taking a little rest..."
          buttonClassName="bg-green-600 hover:bg-green-700"
        />
      )}
    </div>
  );
}
