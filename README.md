# Abigail's Peter Rabbit Game

A 3D browser game built with Next.js, React Three Fiber, and Three.js. Control Peter Rabbit as he hops around a meadow collecting carrots, completing quests, and meeting characters from the world of Beatrix Potter.

## Gameplay

- **Move** Peter Rabbit with arrow keys, **hop** with Space, and **pause** with Escape
- Every second jump, Peter does a front flip
- Explore the meadow and interact with characters by approaching them

## Quests

- **Collect Carrots** — Find all 15 carrots scattered across the meadow
- **Fishing Rod** — Find Jeremy Fisher's lost fishing rod and return it to him at the pond
- **Find Jack Sharp** — After returning the rod, Jeremy Fisher asks you to find his friend Jack Sharp the fish near the edge of the map
- **Magic Stars** — Ado's Sister the unicorn asks you to collect 5 golden stars

## Characters

| Character | Description |
|-----------|-------------|
| **Peter Rabbit** | The player character — hops, collects, and flips |
| **Mr. McGregor** | The farmer — if he catches you, it's game over |
| **Mr. Todd** | A roaming fox with voice lines |
| **Jeremy Fisher** | A frog by the pond who gives you the fishing rod and Jack Sharp quests |
| **Jack Sharp** | A fish that appears after returning the fishing rod |
| **Mercat** | Touch her for a speed boost — she welcomes you to the game |
| **Quinn Rabbit** | Hints about finding Jeremy Fisher |
| **Ado's Sister** | A unicorn who runs in circles and gives the star collection quest |
| **Fred** | A baby dinosaur who hops and sends love hearts when you visit |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Tech Stack

- **Next.js 16** with App Router
- **React Three Fiber** / **Three.js** for 3D rendering
- **Tailwind CSS 4** for UI styling
- **Old Standard TT** font via `next/font`
- **Biome** for linting and formatting
