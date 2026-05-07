#!/usr/bin/env node
// Verifies every game in src/games/registry.ts has the required skeleton.
// Run via `npm run lint:games`.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");

const REQUIRED_FILES = [
  "game.tsx",
  "scene.tsx",
  "constants.ts",
  "types.ts",
  "world-gen.ts",
];

/**
 * Tiny parser: pull slugs from the registry's `slug: "..."` literals.
 * Avoids a dependency on a TS loader for what is a one-purpose check.
 */
function readRegistrySlugs() {
  const path = join(root, "src/games/registry.ts");
  const src = readFileSync(path, "utf8");
  const matches = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (matches.length === 0) {
    throw new Error("No game slugs found in src/games/registry.ts");
  }
  return matches;
}

function listGameDirs() {
  const gamesDir = join(root, "src/games");
  return readdirSync(gamesDir).filter((name) => {
    const p = join(gamesDir, name);
    return statSync(p).isDirectory();
  });
}

const errors = [];

const slugs = readRegistrySlugs();
const dirs = listGameDirs();

// Every directory must be registered.
for (const dir of dirs) {
  if (!slugs.includes(dir)) {
    errors.push(
      `src/games/${dir}/ exists but is not registered in src/games/registry.ts`,
    );
  }
}

// Every registered slug must have a directory + the required skeleton + a route.
for (const slug of slugs) {
  const gameDir = join(root, "src/games", slug);
  if (!existsSync(gameDir)) {
    errors.push(
      `Registry lists "${slug}" but src/games/${slug}/ does not exist`,
    );
    continue;
  }
  for (const required of REQUIRED_FILES) {
    if (!existsSync(join(gameDir, required))) {
      errors.push(`src/games/${slug}/${required} is missing`);
    }
  }

  const routePage = join(root, "src/app", slug, "page.tsx");
  if (!existsSync(routePage)) {
    errors.push(`Route page src/app/${slug}/page.tsx is missing`);
  }

  const assetDir = join(root, "public/games", slug);
  if (!existsSync(assetDir)) {
    errors.push(
      `Asset dir public/games/${slug}/ is missing (create it even if empty)`,
    );
  }
}

if (errors.length > 0) {
  console.error("Game structure check failed:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Game structure OK (${slugs.length} games checked)`);
