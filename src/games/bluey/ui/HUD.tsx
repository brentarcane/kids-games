"use client";

export function HUD({ falls }: { falls: number }) {
  return (
    <div className="absolute top-0 left-0 pointer-events-none p-4 max-w-xs">
      <h1 className="text-2xl font-bold text-white drop-shadow-lg italic leading-tight">
        Bluey!
      </h1>

      <div className="mt-3 bg-sky-950/60 backdrop-blur-sm rounded-lg border border-sky-700/40 px-4 py-3 space-y-1">
        <h2 className="text-xs uppercase tracking-widest text-sky-300/80 font-bold">
          Run!
        </h2>
        <div className="text-sm text-sky-100">Falls: {falls}</div>
      </div>

      <div className="mt-2 text-[10px] text-sky-50/80 leading-relaxed">
        &larr;&rarr; = Run &middot; Space = Jump (twice for a flip!) &middot; F
        = Swap character &middot; Esc = Pause
      </div>
    </div>
  );
}
