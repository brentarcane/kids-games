import type { LevelLayout, Platform } from "./types";

/**
 * Hand-tuned level: a series of platforms with gaps for jumps, two pits that
 * require a double-jump, and a finish flag at the end. Coordinates are in
 * world units; the start platform is at X = 0.
 */
function buildLevel(): LevelLayout {
  const platforms: Platform[] = [];
  let id = 0;
  const add = (x: number, y: number, width: number) => {
    platforms.push({ id: id++, x, y, width });
  };

  // Start: long flat run so Bluey can get her footing
  add(-6, 0, 22);

  // Small gap, single jump
  add(20, 0, 10);

  // Step up, small gap
  add(34, 2, 8);

  // Wider gap — needs a good single jump
  add(48, 2, 8);

  // Big pit ahead — double jump territory.
  add(64, 0, 6);
  // (gap of 9 units to next)
  add(79, 1, 6);

  // Stepping stones — three small platforms in a row with little gaps
  add(89, 3, 4);
  add(96, 4, 4);
  add(103, 3, 4);

  // Drop down to a long run
  add(112, 0, 14);

  // Final pit — wide gap, then the finish platform
  add(134, 0, 18);

  // Finish flag sits near the right end of the last platform
  const last = platforms[platforms.length - 1];
  const finish = { x: last.x + last.width - 4, y: last.y };

  return { platforms, finish };
}

export const LEVEL = buildLevel();
