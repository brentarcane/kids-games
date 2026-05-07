"use client";

export function GameOverOverlay({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
      <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
        <h2 className="text-4xl font-bold text-red-800">
          Caught by Mr. McGregor!
        </h2>
        <p className="text-lg text-amber-800">
          Peter should have stayed out of the garden...
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="px-8 py-3 bg-green-600 text-white text-xl font-bold rounded-full hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
