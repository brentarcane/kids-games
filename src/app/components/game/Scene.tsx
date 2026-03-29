"use client";

import { useCallback, useEffect, useRef } from "react";
import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CameraFollow } from "./CameraFollow";
import {
  ENVIRONMENT_MAP_PATH,
  FORWARD_SPEED,
  GRAVITY,
  GROUND_Y,
  HOP_FORCE,
  SPEED_BOOST_MULTIPLIER,
  SPEED_BOOST_DURATION,
  TURN_SPEED,
  WORLD_RADIUS,
} from "./constants";
import type { Carrot } from "./types";
import { WORLD } from "./world-gen";

// Characters
import { RabbitModel } from "./characters/RabbitModel";
import { MrTodd } from "./characters/MrTodd";
import { MrMcGregor } from "./characters/MrMcGregor";
import { Mercat } from "./characters/Mercat";
import { JeremyFisher } from "./characters/JeremyFisher";
import { QuinnRabbit } from "./characters/QuinnRabbit";

// Environment
import { Ground } from "./environment/Ground";
import { Path } from "./environment/Path";
import { Tree } from "./environment/Tree";
import { Flower } from "./environment/Flower";
import { Rock } from "./environment/Rock";
import { Pond } from "./environment/Pond";
import { ChickenGarden } from "./environment/ChickenGarden";

// Collectibles
import { CarrotItem } from "./collectibles/CarrotItem";

export function Scene({
  carrots,
  onCollectCarrot,
  paused,
  gameOver,
  onCaught,
  showMeshLabels,
}: {
  carrots: Carrot[];
  onCollectCarrot: (id: number) => void;
  paused: boolean;
  gameOver: boolean;
  onCaught: () => void;
  showMeshLabels: boolean;
}) {
  const rabbitGroup = useRef<THREE.Group>(null);
  const velocityY = useRef(0);
  const isOnGround = useRef(true);
  const speedBoostTimer = useRef(0);
  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
  });
  const spaceWasPressed = useRef(false);
  const posY = useRef(GROUND_Y);

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
      if (e.key === "ArrowUp") keysRef.current.up = true;
      if (e.key === "ArrowDown") keysRef.current.down = true;
      if (e.key === " ") {
        e.preventDefault();
        keysRef.current.space = true;
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
      if (e.key === "ArrowUp") keysRef.current.up = false;
      if (e.key === "ArrowDown") keysRef.current.down = false;
      if (e.key === " ") keysRef.current.space = false;
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const onBoost = useCallback(() => {
    speedBoostTimer.current = SPEED_BOOST_DURATION;
  }, []);

  useFrame((_, delta) => {
    if (!rabbitGroup.current || paused) return;
    const keys = keysRef.current;
    const rabbit = rabbitGroup.current;

    if (speedBoostTimer.current > 0) speedBoostTimer.current -= delta;
    const speedMul =
      speedBoostTimer.current > 0 ? SPEED_BOOST_MULTIPLIER : 1;

    if (keys.left) rabbit.rotation.y += TURN_SPEED;
    if (keys.right) rabbit.rotation.y -= TURN_SPEED;

    if (keys.space && !spaceWasPressed.current && isOnGround.current) {
      velocityY.current = HOP_FORCE;
      isOnGround.current = false;
    }
    spaceWasPressed.current = keys.space;

    velocityY.current += GRAVITY;
    posY.current += velocityY.current;

    if (posY.current <= GROUND_Y) {
      posY.current = GROUND_Y;
      velocityY.current = 0;
      isOnGround.current = true;
    }

    rabbit.position.y = posY.current;

    let forward = 0;
    if (keys.up) forward = FORWARD_SPEED * speedMul;
    if (keys.down) forward = -FORWARD_SPEED * 0.5 * speedMul;
    rabbit.position.x -= Math.sin(rabbit.rotation.y) * forward;
    rabbit.position.z -= Math.cos(rabbit.rotation.y) * forward;

    const dist = Math.sqrt(
      rabbit.position.x ** 2 + rabbit.position.z ** 2,
    );
    if (dist > WORLD_RADIUS - 3) {
      const angle = Math.atan2(rabbit.position.x, rabbit.position.z);
      rabbit.position.x = Math.sin(angle) * (WORLD_RADIUS - 3);
      rabbit.position.z = Math.cos(angle) * (WORLD_RADIUS - 3);
    }

    for (const carrot of carrots) {
      if (carrot.collected) continue;
      const dx = rabbit.position.x - carrot.x;
      const dz = rabbit.position.z - carrot.z;
      if (dx * dx + dz * dz < 1.5) {
        onCollectCarrot(carrot.id);
      }
    }
  });

  return (
    <>
      <Environment files={ENVIRONMENT_MAP_PATH} background />
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 80, 50]} intensity={1.2} />

      <Ground />
      <Path />

      {WORLD.trees.map((t) => (
        <Tree key={`t-${t.x}-${t.z}`} data={t} />
      ))}
      {WORLD.flowers.map((f) => (
        <Flower key={`f-${f.x}-${f.z}`} data={f} />
      ))}
      {WORLD.rocks.map((r) => (
        <Rock key={`r-${r.x}-${r.z}`} data={r} />
      ))}
      {WORLD.gardens.map((g) => (
        <ChickenGarden key={`gd-${g.x}-${g.z}`} data={g} />
      ))}

      {carrots.map((c) => (
        <CarrotItem key={c.id} carrot={c} />
      ))}

      <group ref={rabbitGroup} position={[0, GROUND_Y, 0]}>
        <RabbitModel showMeshLabels={showMeshLabels} keysRef={keysRef} />
      </group>

      <MrTodd rabbitRef={rabbitGroup} paused={paused} />
      <MrMcGregor
        rabbitRef={rabbitGroup}
        paused={paused}
        gameOver={gameOver}
        onCaught={onCaught}
      />
      <Mercat rabbitRef={rabbitGroup} paused={paused} onBoost={onBoost} />

      <Pond />
      <JeremyFisher rabbitRef={rabbitGroup} paused={paused} />
      <QuinnRabbit rabbitRef={rabbitGroup} paused={paused} />

      <CameraFollow target={rabbitGroup} />
    </>
  );
}
