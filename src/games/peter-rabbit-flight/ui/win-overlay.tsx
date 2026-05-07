"use client";

export function WinOverlay({
  elapsed,
  onRestart,
}: {
  elapsed: number;
  onRestart: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
      <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
        <h2 className="text-4xl font-bold text-sky-900 italic">
          Course complete!
        </h2>
        <p className="text-lg text-sky-800">Your time: {elapsed.toFixed(2)}s</p>
        <button
          type="button"
          onClick={onRestart}
          className="px-8 py-3 bg-sky-600 text-white text-xl font-bold rounded-full hover:bg-sky-700 transition-colors"
        >
          Fly Again
        </button>
      </div>
    </div>
  );
}
