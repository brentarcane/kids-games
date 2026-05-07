# Contributing

This repo houses multiple kids' games sharing one Next.js shell. Each game is
isolated under `src/games/<slug>/` and rendered by a thin route at
`src/app/<slug>/page.tsx`. The rules below keep the project consistent so any
contributor — kid, parent, or AI agent — can drop in a new game without
re-deriving the conventions.

`npm run lint` enforces the mechanical parts. Read this file for the rest.

## File and folder naming

- All `.ts`/`.tsx`/`.mjs` filenames are **kebab-case**: `game.tsx`, `mr-todd.tsx`,
  `use-animated-model.ts`. Enforced by Biome's `useFilenamingConvention` rule.
- Hook **files** are `use-foo.ts`; the **exported function** is `useFoo`.
- Component files export PascalCase symbols matching the file name:
  `mr-todd.tsx` → `export function MrTodd(...)`.
- One component per file. Default export reserved for a game's top-level
  `Game` component (so the route page can `import Game from "..."`).

## Per-game layout

Every game directory must contain these files:

```
src/games/<slug>/
  game.tsx          # default export, "use client", owns React state + Canvas
  scene.tsx         # named export `Scene`, R3F scene graph + per-frame logic
  constants.ts      # tunables, asset path constants, magic numbers
  types.ts          # game-specific TS types
  world-gen.ts      # static or procedural world layout
```

Optional sub-folders, used as needed:

```
  characters/       # NPC + player models
  collectibles/     # pickups
  environment/      # static world pieces (ground, sky, platforms, …)
  ui/               # game-specific HUD or overlay tweaks
```

`scripts/check-game-structure.mjs` (run by `npm run lint`) fails CI if any
required file is missing, if a game directory exists without a registry entry,
or if a registered slug has no directory / no route page / no asset folder.

## Routes and the game registry

`src/games/registry.ts` is the single source of truth for which games exist
and their metadata. To add a game:

1. Create `src/games/<slug>/` with the required skeleton.
2. Create `public/games/<slug>/` for runtime assets (models, audio, images,
   textures). Even an empty folder is fine.
3. Append an entry to `GAMES` in `src/games/registry.ts`. TypeScript narrows
   `GameSlug` automatically; the homepage and the asset-path helper pick up
   the new slug with no further changes.
4. Create the route stamp at `src/app/<slug>/page.tsx`:

   ```tsx
   import Game from "@/games/<slug>/game";

   export default function Page() {
     return <Game />;
   }
   ```

The homepage at `src/app/page.tsx` reads from the registry, so you do **not**
hand-edit it when adding a game.

## Imports

- Game code may import from `@/components/`, `@/hooks/`, `@/lib/`, and
  `@/games/registry`. **No cross-game imports** — `src/games/peter-rabbit/`
  must not import from `src/games/bluey/` etc.
- Inside a game folder, prefer relative imports (`./scene`, `../constants`).
  Outside it, use the `@/…` alias.
- Asset URLs are built via `assetPath(slug, "subpath")` from `@/lib/asset-path`.
  Never type `"/games/<slug>/..."` literals — the helper guarantees the slug
  matches a real game and prevents typos.

## Shared building blocks

Live under these directories — reach for them before forking your own copy:

- `src/components/` — reusable UI. Includes `PauseOverlay` and
  `MessageOverlay` (used for win / game-over screens) plus the `Accent` color
  palette in `accent.ts`.
- `src/hooks/` — reusable R3F / game hooks. Today: `useAnimatedModel`,
  `useProximityVoice`, `useRoamingNPC`.
- `src/lib/` — pure helpers (no React). Today: `assetPath`.

If you find yourself copy-pasting from another game, that's a signal to lift
the code into one of these shared spots instead.

## Code style

- Default to no comments. Add one only when the *why* is non-obvious (a hidden
  constraint, a workaround, a value picked after experimentation).
- Don't write JSDoc that just restates the function name. Hooks/utilities with
  non-obvious behavior are the exception.
- Trust framework guarantees. No defensive `if (!window) return` or fallback
  scaffolding for situations that can't happen.
- Keep commits focused. Renames + refactors + new features go in separate
  commits when feasible.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # biome + game-structure check
npm run format   # biome formatter
```

Node 20+ is required (`scripts/check-game-structure.mjs` uses
`node:fs` ESM imports and `import.meta.url`).
