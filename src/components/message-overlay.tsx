"use client";

import type { ReactNode } from "react";
import { ACCENTS, type Accent } from "./accent";

export function MessageOverlay({
  title,
  body,
  actionLabel,
  onAction,
  accent = "sky",
  italic,
  titleClassName,
  buttonClassName,
}: {
  title: string;
  body?: ReactNode;
  actionLabel: string;
  onAction: () => void;
  accent?: Accent;
  italic?: boolean;
  titleClassName?: string;
  buttonClassName?: string;
}) {
  const a = ACCENTS[accent];
  const titleClass = titleClassName ?? a.heading;
  const buttonClass = buttonClassName ?? a.button;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
      <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl px-12 py-10 shadow-2xl">
        <h2
          className={`text-4xl font-bold ${titleClass}${italic ? " italic" : ""}`}
        >
          {title}
        </h2>
        {body ? <p className={`text-lg ${a.body}`}>{body}</p> : null}
        <button
          type="button"
          onClick={onAction}
          className={`px-8 py-3 ${buttonClass} text-white text-xl font-bold rounded-full transition-colors`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
