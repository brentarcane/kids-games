"use client";

import type { ReactNode } from "react";
import { ACCENTS, type Accent } from "./accent";

export function PauseOverlay({
  onResume,
  accent = "sky",
  body,
  buttonClassName,
}: {
  onResume: () => void;
  accent?: Accent;
  body?: ReactNode;
  buttonClassName?: string;
}) {
  const a = ACCENTS[accent];
  const button = buttonClassName ?? a.button;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
      <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
        <h2 className={`text-4xl font-bold ${a.heading}`}>Paused</h2>
        {body ? <p className={`text-lg ${a.body}`}>{body}</p> : null}
        <button
          type="button"
          onClick={onResume}
          className={`px-8 py-3 ${button} text-white text-xl font-bold rounded-full transition-colors`}
        >
          Resume
        </button>
        <p className={`text-sm ${a.subtitle}`}>Press Escape to resume</p>
      </div>
    </div>
  );
}
