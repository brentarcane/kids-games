export type Accent = "amber" | "sky" | "rose";

export const ACCENTS: Record<
  Accent,
  { heading: string; body: string; subtitle: string; button: string }
> = {
  amber: {
    heading: "text-amber-900",
    body: "text-amber-800",
    subtitle: "text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  sky: {
    heading: "text-sky-900",
    body: "text-sky-800",
    subtitle: "text-sky-700",
    button: "bg-sky-600 hover:bg-sky-700",
  },
  rose: {
    heading: "text-rose-900",
    body: "text-rose-800",
    subtitle: "text-rose-700",
    button: "bg-rose-600 hover:bg-rose-700",
  },
};
