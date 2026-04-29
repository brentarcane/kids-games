import { RING_COUNT } from "./constants";
import type { Ring } from "./types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Lays out rings in a meandering forward course so the player has to
 * pitch and turn to hit each one. Each ring's yaw points roughly toward
 * the next so they read as gates rather than random hoops.
 */
function generateCourse() {
  const rng = seededRandom(7);
  const rings: Ring[] = [];

  let x = 0;
  let y = 30;
  let z = -40; // first ring out in front of the spawn (player flies -Z)
  let heading = 0; // yaw

  for (let i = 0; i < RING_COUNT; i++) {
    rings.push({ id: i, x, y, z, yaw: heading, passed: false });

    // Step forward along the heading
    const step = 50 + rng() * 30;
    const turn = (rng() - 0.5) * 0.9; // up to ~25° turn per gate
    const climb = (rng() - 0.5) * 12;

    heading += turn;
    x -= Math.sin(heading) * step;
    z -= Math.cos(heading) * step;
    y = Math.max(15, Math.min(60, y + climb));
  }

  return { rings };
}

export const COURSE = generateCourse();
