import type { GameSlug } from "@/games/registry";

/**
 * Build the public URL for a game asset. All runtime assets live under
 * `public/games/<slug>/<...>`, so callers should never type that prefix
 * by hand — pass the slug + the path inside the game's asset folder.
 *
 * Example:
 *   assetPath("peter-rabbit", "models/characters/peter_rabbit.glb")
 *   // -> "/games/peter-rabbit/models/characters/peter_rabbit.glb"
 */
export function assetPath(slug: GameSlug, ...parts: string[]): string {
  const tail = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return `/games/${slug}/${tail}`;
}
