"use client";

import { CARROT_COUNT } from "../constants";

export function HUD({
  collected,
  total,
  showMeshLabels,
}: {
  collected: number;
  total: number;
  showMeshLabels: boolean;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none flex flex-col items-center gap-2 pt-4">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg">
        Peter Rabbit&apos;s Meadow
      </h1>
      <div className="flex gap-4 text-lg text-white drop-shadow-md bg-black/30 rounded-full px-6 py-2">
        <span>
          Carrots: {collected}/{total}
        </span>
        {collected === total && (
          <span className="text-yellow-300 font-bold animate-pulse">
            You found them all!
          </span>
        )}
      </div>
      <p className="text-sm text-orange-100/95 drop-shadow-md max-w-md text-center px-4">
        Watch out for Mr. McGregor and Mr. Todd — collect all the carrots!
      </p>
      <div className="text-sm text-white/80 drop-shadow-sm mt-1">
        Space = Hop &middot; &uarr;/&darr; = Move &middot; &larr;/&rarr; =
        Steer &middot; M = mesh labels
      </div>
      {showMeshLabels && (
        <div className="mt-1 rounded-full bg-amber-900/85 px-4 py-1.5 text-xs text-amber-50 shadow-md ring-1 ring-amber-600/50">
          Mesh debug: numbers = traversal order (0, 1, 2…). Names from the
          GLB.
        </div>
      )}
    </div>
  );
}
