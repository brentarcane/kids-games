"use client";

export function HUD({
  passed,
  total,
  elapsed,
  boostActive,
}: {
  passed: number;
  total: number;
  elapsed: number;
  boostActive: boolean;
}) {
  return (
    <div className="absolute top-0 left-0 pointer-events-none p-4 max-w-xs">
      <h1 className="text-2xl font-bold text-amber-50 drop-shadow-lg italic leading-tight">
        Peter Rabbit Flight Simulator
      </h1>

      <div className="mt-3 bg-sky-950/60 backdrop-blur-sm rounded-lg border border-sky-700/40 px-4 py-3 space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-sky-300/80 font-bold">
          Course
        </h2>

        <div className="text-sm text-sky-100">
          Rings: {passed}/{total}
        </div>
        <div className="text-sm text-sky-100">Time: {elapsed.toFixed(1)}s</div>
        {boostActive && (
          <div className="text-sm text-yellow-300 font-bold animate-pulse">
            BOOST!
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-sky-200/50 leading-relaxed">
        &uarr;&darr; = Pitch &middot; &larr;&rarr; = Turn &middot; Space = Boost
        &middot; Esc = Pause
        <br />
        Click = Mouse view (Esc to exit)
      </div>
    </div>
  );
}
