"use client";

import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import type * as THREE from "three";
import { CameraFollow } from "./camera-follow";
import { AdosSister } from "./characters/ados-sister";
import { Fred } from "./characters/fred";
import { JackSharp } from "./characters/jack-sharp";
import { JeremyFisher } from "./characters/jeremy-fisher";
import { LilyRabbit } from "./characters/lily-rabbit";
import { Mercat } from "./characters/mercat";
import { MrMcGregor } from "./characters/mr-mcgregor";
import { MrTodd } from "./characters/mr-todd";
import { QuinnRabbit } from "./characters/quinn-rabbit";
// Characters
import { RabbitModel } from "./characters/rabbit-model";
import { SammyWhiskers } from "./characters/sammy-whiskers";
import { Spider } from "./characters/spider";
// Collectibles
import { CarrotItem } from "./collectibles/carrot-item";
import { FishingRod, FishingRodModel } from "./collectibles/fishing-rod";
import { StarItem } from "./collectibles/star-item";
import {
  ENVIRONMENT_MAP_PATH,
  FISHING_ROD_PICKUP_RADIUS,
  FISHING_ROD_SCALE,
  FORWARD_SPEED,
  GRAVITY,
  GROUND_Y,
  HOP_FORCE,
  SPEED_BOOST_DURATION,
  SPEED_BOOST_MULTIPLIER,
  STAR_COLLECT_RADIUS,
  TURN_SPEED,
  WORLD_RADIUS,
} from "./constants";
import { ChickenGarden } from "./environment/chicken-garden";
import { Flower } from "./environment/flower";
// Environment
import { Ground } from "./environment/ground";
import { Path } from "./environment/path";
import { Pond } from "./environment/pond";
import { Rock } from "./environment/rock";
import { SkyWall } from "./environment/sky-wall";
import { Tree } from "./environment/tree";
import type { Carrot } from "./types";
import { WORLD } from "./world-gen";

export function Scene({
  carrots,
  onCollectCarrot,
  paused,
  gameOver,
  onCaught,
  showMeshLabels,
  rodPickedUp,
  rodDelivered,
  onPickUpRod,
  onDeliverRod,
  fishFound,
  onFindFish,
  stars,
  onCollectStar,
}: {
  carrots: Carrot[];
  onCollectCarrot: (id: number) => void;
  paused: boolean;
  gameOver: boolean;
  onCaught: () => void;
  showMeshLabels: boolean;
  rodPickedUp: boolean;
  rodDelivered: boolean;
  onPickUpRod: () => void;
  onDeliverRod: () => void;
  fishFound: boolean;
  onFindFish: () => void;
  stars: import("./types").Star[];
  onCollectStar: (id: number) => void;
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
  const jumpCount = useRef(0);
  const isFlipJump = useRef(false);

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
    const speedMul = speedBoostTimer.current > 0 ? SPEED_BOOST_MULTIPLIER : 1;

    if (keys.left) rabbit.rotation.y += TURN_SPEED;
    if (keys.right) rabbit.rotation.y -= TURN_SPEED;

    if (keys.space && !spaceWasPressed.current && isOnGround.current) {
      velocityY.current = HOP_FORCE;
      isOnGround.current = false;
      jumpCount.current += 1;
      isFlipJump.current = jumpCount.current % 2 === 0;
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

    const dist = Math.sqrt(rabbit.position.x ** 2 + rabbit.position.z ** 2);
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

    // Star collection
    for (const star of stars) {
      if (star.collected) continue;
      const sdx = rabbit.position.x - star.x;
      const sdz = rabbit.position.z - star.z;
      if (sdx * sdx + sdz * sdz < STAR_COLLECT_RADIUS * STAR_COLLECT_RADIUS) {
        onCollectStar(star.id);
      }
    }

    // Fishing rod pickup
    if (!rodPickedUp && !rodDelivered) {
      const rdx = rabbit.position.x - WORLD.fishingRod.x;
      const rdz = rabbit.position.z - WORLD.fishingRod.z;
      if (
        rdx * rdx + rdz * rdz <
        FISHING_ROD_PICKUP_RADIUS * FISHING_ROD_PICKUP_RADIUS
      ) {
        onPickUpRod();
      }
    }
  });

  return (
    <>
      <Environment files={ENVIRONMENT_MAP_PATH} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 80, 50]} intensity={1.2} />

      <Ground />
      <SkyWall />
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
        <RabbitModel
          showMeshLabels={showMeshLabels}
          keysRef={keysRef}
          isFlipJump={isFlipJump}
        />
        {/* Fishing rod attached to Peter while carrying */}
        {rodPickedUp && !rodDelivered && (
          <group position={[0.6, 1.2, -0.3]} rotation={[0.3, 0, -0.2]}>
            <FishingRodModel scale={FISHING_ROD_SCALE} />
          </group>
        )}
      </group>

      <MrTodd rabbitRef={rabbitGroup} paused={paused} />
      <MrMcGregor
        rabbitRef={rabbitGroup}
        paused={paused}
        gameOver={gameOver}
        onCaught={onCaught}
      />
      <Mercat rabbitRef={rabbitGroup} paused={paused} onBoost={onBoost} />

      <FishingRod
        x={WORLD.fishingRod.x}
        z={WORLD.fishingRod.z}
        pickedUp={rodPickedUp}
      />

      <Pond />
      <JeremyFisher
        rabbitRef={rabbitGroup}
        paused={paused}
        rodPickedUp={rodPickedUp}
        rodDelivered={rodDelivered}
        onDeliverRod={onDeliverRod}
        fishFound={fishFound}
      />
      {rodDelivered && (
        <JackSharp
          rabbitRef={rabbitGroup}
          paused={paused}
          fishFound={fishFound}
          onFindFish={onFindFish}
        />
      )}
      <QuinnRabbit rabbitRef={rabbitGroup} paused={paused} />

      {stars.map((s) => (
        <StarItem key={`star-${s.id}`} star={s} />
      ))}
      <AdosSister
        rabbitRef={rabbitGroup}
        paused={paused}
        starsCollected={stars.filter((s) => s.collected).length}
      />

      <Fred rabbitRef={rabbitGroup} paused={paused} />
      <LilyRabbit rabbitRef={rabbitGroup} paused={paused} />
      <Spider rabbitRef={rabbitGroup} paused={paused} />
      <SammyWhiskers rabbitRef={rabbitGroup} paused={paused} />

      <CameraFollow target={rabbitGroup} />
    </>
  );
}
