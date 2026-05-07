import { assetPath } from "@/lib/asset-path";

// ─── Asset paths ────────────────────────────────────────────────────────────

export const PLANE_MODEL_PATH = assetPath(
  "peter-rabbit-flight",
  "models/plane.glb",
);
export const PILOT_MODEL_PATH = assetPath(
  "peter-rabbit-flight",
  "models/peter_rabbit.glb",
);

// ─── Plane visuals (tweak to taste) ─────────────────────────────────────────

export const PLANE_SCALE = 5.0;
/** Rotate the plane model on Y if its nose isn't pointing along -Z by default. */
export const PLANE_MODEL_YAW = Math.PI;

export const PILOT_SCALE = 6.0;
export const PILOT_OFFSET: [number, number, number] = [0, 1.8, -2];
/** Yaw on the pilot in case the GLB faces a different direction than the plane. */
export const PILOT_YAW = Math.PI; // most rabbit GLBs face +Z; flip to -Z

// ─── Plane physics ──────────────────────────────────────────────────────────

export const PLANE_SPEED = 25; // units per second
export const PLANE_BOOST_MULT = 2.0;
export const PLANE_BOOST_DURATION = 1.5;
export const PITCH_RATE = 1.2; // radians per second
export const YAW_RATE = 1.0;
export const PITCH_LIMIT = Math.PI * 0.45; // clamp so plane can't go fully vertical
export const ROLL_VISUAL_MAX = 0.7; // visual bank during turns
export const ROLL_LERP = 6;

// ─── World ──────────────────────────────────────────────────────────────────

export const SKY_COLOR = "#87ceeb";
export const FOG_NEAR = 80;
export const FOG_FAR = 400;
export const GROUND_Y = 0;
export const GROUND_SIZE = 800;
export const CLOUD_COUNT = 60;

// ─── Rings ──────────────────────────────────────────────────────────────────

export const RING_COUNT = 10;
export const RING_RADIUS = 6;
export const RING_TUBE = 0.5;
export const RING_DETECT_RADIUS = 6.5;
export const RING_ACTIVE_COLOR = "#FFD700";
export const RING_INACTIVE_COLOR = "#5577aa";
export const RING_PASSED_COLOR = "#33cc66";

// ─── Camera ─────────────────────────────────────────────────────────────────

/** Distance behind the plane along its forward axis. */
export const CAMERA_BACK = 10;
/** Height above the plane. */
export const CAMERA_UP = 3;
/** How quickly the camera lerps toward its target each frame. */
export const CAMERA_LERP = 0.08;

// ─── Orbit (pointer lock) camera ────────────────────────────────────────────

export const ORBIT_DISTANCE = 14;
export const ORBIT_SENSITIVITY = 0.0035;
export const ORBIT_PITCH_LIMIT = 1.3; // ~75°
