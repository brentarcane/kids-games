# Kids' Games

A catalogue of small browser games built with and for our kids, sharing one
Next.js + React Three Fiber shell. Pick a game from the homepage and play.

## Games

### Abigail's Peter Rabbit Game

Hop around a 3D meadow as Peter Rabbit, collect carrots, and meet characters
from the world of Beatrix Potter.

- **Move** with arrow keys, **hop** with Space, **pause** with Escape
- Every second jump, Peter does a front flip
- Quests: collect 15 carrots, return Jeremy Fisher's fishing rod, find Jack
  Sharp the fish, and gather 5 magic stars for Ado's Sister
- Cast: Peter Rabbit, Mr. McGregor, Mr. Todd, Jeremy Fisher, Jack Sharp,
  Mercat, Quinn Rabbit, Ado's Sister, Fred, Lily Rabbit, Sammy Whiskers,
  Spider

### Peter Rabbit Flight Simulator

Pilot a plane through a sequential ring course. Pitch, turn, and boost to a
fast time.

- **Fly** with arrow keys, **boost** with Shift, **pause** with Escape

### Bluey!

A 2.5D side-scroller. Run, jump, and double-jump-flip your way across the
platforms to the finish flag.

- **Run** with arrow keys, **jump** with Space (twice for a flip)

## Contributors

- **Abigail** — game ideas, character designs, voiceovers, playtesting
- **Brent Arcane** — engineering

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Adding a new game

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full ruleset (per-game
layout, naming conventions, registry, asset paths, shared building blocks).
`npm run lint` enforces the mechanical parts.

## Tech stack

- **Next.js 16** with App Router
- **React Three Fiber** / **Three.js** for 3D rendering
- **Tailwind CSS 4** for UI styling
- **Old Standard TT** font via `next/font`
- **Biome** for linting and formatting
