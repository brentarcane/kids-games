"use client";

import { STAR_COUNT } from "../constants";

export function HUD({
  collected,
  total,
  showMeshLabels,
  rodPickedUp,
  rodDelivered,
  fishFound,
  starsCollected,
}: {
  collected: number;
  total: number;
  showMeshLabels: boolean;
  rodPickedUp: boolean;
  rodDelivered: boolean;
  fishFound: boolean;
  starsCollected: number;
}) {
  return (
    <div className="absolute top-0 left-0 pointer-events-none p-4 max-w-xs">
      <h1 className="text-2xl font-bold text-amber-50 drop-shadow-lg italic leading-tight">
        Abigail&apos;s Peter Rabbit Game
      </h1>

      <div className="mt-3 bg-amber-950/60 backdrop-blur-sm rounded-lg border border-amber-700/40 px-4 py-3 space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-amber-400/80 font-bold">
          Quests
        </h2>

        {/* Carrots */}
        <div className="flex items-center gap-2 text-sm text-amber-100">
          <span className="text-base">
            {collected === total ? "\u2714" : "\u00b7"}
          </span>
          <span>
            Carrots: {collected}/{total}
            {collected === total && (
              <span className="ml-1.5 text-yellow-300 font-bold animate-pulse">
                All found!
              </span>
            )}
          </span>
        </div>

        {/* Fishing rod */}
        <div className="flex items-center gap-2 text-sm text-amber-100">
          <span className="text-base">
            {rodDelivered ? "\u2714" : "\u00b7"}
          </span>
          <span>
            {rodDelivered ? (
              <span className="text-green-300">Rod returned to Jeremy Fisher</span>
            ) : rodPickedUp ? (
              <span className="text-cyan-300">Bring rod to Jeremy Fisher</span>
            ) : (
              "Find the lost fishing rod"
            )}
          </span>
        </div>

        {/* Jack Sharp — only visible after rod is delivered */}
        {rodDelivered && (
          <div className="flex items-center gap-2 text-sm text-amber-100">
            <span className="text-base">
              {fishFound ? "\u2714" : "\u00b7"}
            </span>
            <span>
              {fishFound ? (
                <span className="text-green-300">Found Jack Sharp!</span>
              ) : (
                "Find Jack Sharp the fish"
              )}
            </span>
          </div>
        )}
        {/* Stars */}
        <div className="flex items-center gap-2 text-sm text-amber-100">
          <span className="text-base">
            {starsCollected === STAR_COUNT ? "\u2714" : "\u00b7"}
          </span>
          <span>
            Stars: {starsCollected}/{STAR_COUNT}
            {starsCollected === STAR_COUNT && (
              <span className="ml-1.5 text-yellow-300 font-bold animate-pulse">
                All found!
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Controls hint — small, unobtrusive */}
      <div className="mt-2 text-[10px] text-amber-200/50 leading-relaxed">
        Space = Hop &middot; &uarr;&darr; = Move &middot; &larr;&rarr; = Steer
        &middot; M = mesh labels &middot; Esc = Pause
      </div>

      {showMeshLabels && (
        <div className="mt-1 rounded bg-amber-900/85 px-3 py-1 text-[10px] text-amber-50 ring-1 ring-amber-600/50">
          Mesh debug on
        </div>
      )}
    </div>
  );
}
