"use client";

export function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
      <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
        <h2 className="text-4xl font-bold text-sky-900">Paused</h2>
        <button
          type="button"
          onClick={onResume}
          className="px-8 py-3 bg-sky-600 text-white text-xl font-bold rounded-full hover:bg-sky-700 transition-colors"
        >
          Resume
        </button>
        <p className="text-sm text-sky-700">Press Escape to resume</p>
      </div>
    </div>
  );
}
