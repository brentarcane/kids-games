import Link from "next/link";
import { GAMES } from "@/games/registry";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-amber-50 to-amber-100 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-5xl font-bold text-amber-900 italic mb-2">
          Abigail&apos;s Games
        </h1>
        <p className="text-amber-800 mb-10">Pick a game to play.</p>

        <div className="grid gap-6 sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              href={`/${g.slug}`}
              className="block rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-amber-200 transition hover:bg-white hover:shadow-lg hover:ring-amber-400"
            >
              <h2 className="text-2xl font-bold text-amber-900 mb-2">
                {g.title}
              </h2>
              <p className="text-amber-800 text-sm">{g.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
