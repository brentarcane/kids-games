/**
 * Source of truth for every game in the app.
 *
 * Adding a new game:
 *   1. Build it under `src/games/<slug>/` following the required skeleton
 *      (see CONTRIBUTING.md — checked by `scripts/check-game-structure.ts`).
 *   2. Put runtime assets in `public/games/<slug>/`.
 *   3. Append an entry below — TypeScript will narrow `GameSlug` automatically
 *      and the homepage / route resolver will pick it up.
 *   4. Create the route stamp at `src/app/<slug>/page.tsx`.
 */
export type GameMeta = {
  slug: string;
  title: string;
  description: string;
  controls?: string;
};

export const GAMES = [
  {
    slug: "peter-rabbit",
    title: "Abigail's Peter Rabbit Game",
    description:
      "Hop around the meadow, collect carrots, and meet Beatrix Potter's characters in 3D.",
    controls: "Arrow keys to move, Space to hop, Escape to pause.",
  },
  {
    slug: "peter-rabbit-flight",
    title: "Peter Rabbit Flight Simulator",
    description:
      "Pilot a plane through a sequential ring course. Pitch, turn, and boost to a fast time.",
    controls: "Arrow keys to fly, Shift to boost, Escape to pause.",
  },
  {
    slug: "bluey",
    title: "Bluey!",
    description:
      "A 2.5D side-scroller. Run, jump, and double-jump-flip your way across the platforms to the finish flag.",
    controls: "Arrow keys to run, Space to jump (twice for a flip).",
  },
] as const satisfies readonly GameMeta[];

export type GameSlug = (typeof GAMES)[number]["slug"];

export function getGame(slug: GameSlug): GameMeta {
  const g = GAMES.find((entry) => entry.slug === slug);
  if (!g) throw new Error(`Unknown game slug: ${slug}`);
  return g;
}
