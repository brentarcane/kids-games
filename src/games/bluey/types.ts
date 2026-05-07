export type Platform = {
  id: number;
  /** Left edge X. */
  x: number;
  /** Top surface Y. */
  y: number;
  /** Width along X. */
  width: number;
};

export type LevelLayout = {
  platforms: Platform[];
  /** Position of the finish flag (X is its base X, Y is the platform top it sits on). */
  finish: { x: number; y: number };
};

export type Facing = "left" | "right";
