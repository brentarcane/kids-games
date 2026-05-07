<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Multi-game project rules

This repo houses several games sharing one Next.js shell. Before adding,
moving, or renaming any file, read [CONTRIBUTING.md](./CONTRIBUTING.md) — it
defines the per-game layout, file naming, registry, and shared-code
conventions that `npm run lint` enforces.

Quick-reference for agents:

- **Filenames:** kebab-case for every `.ts` / `.tsx` / `.mjs`. Component file
  `mr-todd.tsx` exports `MrTodd`. Hook file `use-foo.ts` exports `useFoo`.
- **New game:** scaffold under `src/games/<slug>/` with the required skeleton
  (`game.tsx`, `scene.tsx`, `constants.ts`, `types.ts`, `world-gen.ts`),
  register in `src/games/registry.ts`, drop assets in `public/games/<slug>/`,
  and stamp a route at `src/app/<slug>/page.tsx`. Don't touch the homepage —
  it derives from the registry.
- **Asset URLs:** always `assetPath(slug, "subpath")` from `@/lib/asset-path`,
  never `"/games/..."` literals.
- **No cross-game imports.** Shared code lives in `@/components/`,
  `@/hooks/`, `@/lib/`. If you're tempted to import from a sibling game,
  promote the code to a shared location instead.
- **Verify before finishing:** `npm run lint` (biome + structure check) must
  pass. `npx tsc --noEmit` must pass.
