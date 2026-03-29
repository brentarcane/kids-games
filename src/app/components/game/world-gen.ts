import { CARROT_COUNT, FENCE_SECTION_WIDTH, WORLD_RADIUS } from "./constants";
import type { Carrot, FlowerData, GardenData, RockData, TreeData } from "./types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateWorld() {
  const rng = seededRandom(42);

  const trees: TreeData[] = [];
  for (let i = 0; i < 40; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 12 + rng() * (WORLD_RADIUS - 20);
    trees.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      scale: 0.8 + rng() * 0.8,
      trunkHeight: 2 + rng() * 2,
      leafRadius: 1.5 + rng() * 1.5,
    });
  }

  const flowers: FlowerData[] = [];
  const flowerColors = [
    "#ff69b4",
    "#ff6347",
    "#ffd700",
    "#da70d6",
    "#ff8c00",
    "#87ceeb",
  ];
  for (let i = 0; i < 80; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 3 + rng() * (WORLD_RADIUS - 10);
    flowers.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      color: flowerColors[Math.floor(rng() * flowerColors.length)],
    });
  }

  const rocks: RockData[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 5 + rng() * (WORLD_RADIUS - 15);
    rocks.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      scale: 0.3 + rng() * 0.7,
    });
  }

  const carrots: Carrot[] = [];
  for (let i = 0; i < CARROT_COUNT; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 5 + rng() * 40;
    carrots.push({
      id: i,
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      collected: false,
    });
  }

  const gardens: GardenData[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 12 + rng() * (WORLD_RADIUS - 30);
    const w = 2 + Math.floor(rng() * 2);
    const d = 2 + Math.floor(rng() * 2);
    const chickenCount = 1 + Math.floor(rng() * 3);
    const chickens: GardenData["chickens"] = [];
    const halfW = (w * FENCE_SECTION_WIDTH) / 2 - 0.4;
    const halfD = (d * FENCE_SECTION_WIDTH) / 2 - 0.4;
    for (let c = 0; c < chickenCount; c++) {
      chickens.push({
        cx: (rng() - 0.5) * 2 * halfW,
        cz: (rng() - 0.5) * 2 * halfD,
        facing: rng() * Math.PI * 2,
      });
    }
    gardens.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      rotation: rng() * Math.PI * 2,
      width: w,
      depth: d,
      chickens,
    });
  }

  return { trees, flowers, rocks, carrots, gardens };
}

export const WORLD = generateWorld();
