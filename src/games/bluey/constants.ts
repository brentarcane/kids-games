import { assetPath } from "@/lib/asset-path";

// ─── Asset paths ────────────────────────────────────────────────────────────

export const BLUEY_MODEL_PATH = assetPath("bluey", "models/bluey.glb");
export const BLUEY_FAMILY_MODEL_PATH = assetPath(
  "bluey",
  "models/bluey-family.glb",
);

// ─── Bluey visuals ──────────────────────────────────────────────────────────

export const BLUEY_SCALE = 1.0;
/** Yaw applied to the model so its forward axis aligns with body-local +Z.
 *  Tweak if the loaded GLB faces a different direction by default. */
export const BLUEY_MODEL_YAW = Math.PI;

// ─── Family visuals ─────────────────────────────────────────────────────────

/** Target on-screen height (world units) for the family model. The rig
 *  auto-derives scale from the GLB's natural bounding box so the family
 *  ends up roughly the same size as Bluey regardless of how the model
 *  was authored. Tweak if the family reads too tall/short. */
export const BLUEY_FAMILY_TARGET_HEIGHT = 3.5;
export const BLUEY_FAMILY_MODEL_YAW = Math.PI;

// ─── Character swap entry animation ─────────────────────────────────────────

/** Local offset (relative to player position) where a freshly-swapped-in
 *  character starts before sliding into place. Reads as "top-left of the
 *  viewport" given the default camera framing. */
export const ENTRY_OFFSET_X = -14;
export const ENTRY_OFFSET_Y = 9;
/** Seconds for the entry slide-in to complete. */
export const ENTRY_DURATION = 0.7;
/** Starting scale for the entry pop. Eases up to 1.0. */
export const ENTRY_START_SCALE = 0.7;

// ─── Movement / physics ─────────────────────────────────────────────────────

export const RUN_SPEED = 9; // units per second
export const AIR_CONTROL = 0.85; // fraction of run speed while airborne
export const JUMP_VELOCITY = 16;
export const DOUBLE_JUMP_VELOCITY = 15;
export const GRAVITY = 38; // units / second²
export const MAX_FALL_SPEED = 32;
export const FACING_LERP = 14; // how quickly Bluey turns to face her travel direction

// ─── Double-jump flip ───────────────────────────────────────────────────────

/** Time for one full forward roll, in seconds. */
export const FLIP_DURATION = 0.55;

// ─── Camera ─────────────────────────────────────────────────────────────────

/** Distance the camera sits in front of the action plane (along +Z). */
export const CAMERA_Z = 18;
/** Height above Bluey. */
export const CAMERA_Y_OFFSET = 4;
/** How far ahead in X the camera leads Bluey (signed by facing). */
export const CAMERA_LOOK_AHEAD = 4;
/** Smoothing for camera position. */
export const CAMERA_LERP = 0.1;
/** Floor on camera Y so it doesn't dip into pits. */
export const CAMERA_MIN_Y = 5;
/** How quickly the camera lead-ahead value re-targets when Bluey turns
 *  around. Lower = lazier transition (no whip-pan when reversing). */
export const CAMERA_LEAD_LERP = 2.5;

// ─── World ──────────────────────────────────────────────────────────────────

export const SKY_COLOR = "#7ac3ff"; // Bluey-cartoon bright blue
export const FOG_NEAR = 40;
export const FOG_FAR = 140;

export const PLATFORM_DEPTH = 6; // depth (Z) of platform boxes
export const PLATFORM_THICKNESS = 2; // visual thickness below the top surface
export const PLATFORM_TOP_COLOR = "#5fbf3f";
export const PLATFORM_SIDE_COLOR = "#7a4a26";

/** Y below which Bluey is considered to have fallen into a pit. */
export const FALL_THRESHOLD = -12;

/** Where Bluey starts each life. */
export const SPAWN_X = 0;
export const SPAWN_Y = 4;

// ─── Finish ─────────────────────────────────────────────────────────────────

export const FINISH_FLAG_HEIGHT = 5;
export const FINISH_DETECT_RADIUS = 2.5;
