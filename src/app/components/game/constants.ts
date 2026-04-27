// ─── Asset paths ────────────────────────────────────────────────────────────

export const RABBIT_MODEL_PATH = "/models/characters/peter_rabbit.glb";
export const FOX_MODEL_PATH = "/models/characters/fox_animation.glb";
export const FARMER_MODEL_PATH = "/models/characters/lowpolyfarmerman.glb";
export const MERCAT_MODEL_PATH = "/models/characters/mercat.glb";
export const QUINN_MODEL_PATH = "/models/characters/quinn_rabbit.glb";
export const FROG_MODEL_PATH = "/models/characters/frog.glb";
export const CHICKEN_MODEL_PATH = "/models/characters/chicken.glb";
export const POND_MODEL_PATH = "/models/environment/pond.glb";
export const CARROT_MODEL_PATH = "/models/collectibles/carrot.glb";
export const FISHING_ROD_MODEL_PATH = "/models/collectibles/fishing_rod.glb";

export const BG_MUSIC_PATH = "/audio/music/bg-music.mp3";
export const MR_TODD_VOICE_PATH = "/audio/voiceover/mr-todd-1.mp3";
export const JEREMY_FISHER_VOICE_PATH = "/audio/voiceover/jeremy-fisher.mp3";
export const QUINN_VOICE_PATH = "/audio/voiceover/quinn-rabbit.mp3";
export const MERCAT_VOICE_PATH = "/audio/voiceover/abigail-1.mp3";

export const ENVIRONMENT_MAP_PATH = "/images/bg-3.jpg";
export const GROUND_COLOR_MAP_PATH =
  "/textures/Poliigon_GrassPatchyGround_4585_BaseColor.jpg";
export const GROUND_NORMAL_MAP_PATH =
  "/textures/Poliigon_GrassPatchyGround_4585_Normal.png";

// ─── Physics & movement ─────────────────────────────────────────────────────

export const HOP_FORCE = 0.24;
export const TURN_SPEED = 0.045;
export const FORWARD_SPEED = 0.18;
export const GRAVITY = -0.006;
export const GROUND_Y = 0.5;
export const WORLD_RADIUS = 115;
export const CARROT_COUNT = 15;

/** Approximate max height above GROUND_Y from current hop physics. */
export const HOP_HEIGHT_HINT = 0.42;

// ─── Rabbit ─────────────────────────────────────────────────────────────────

export const RABBIT_SCALE = 6;
/** GLB forward vs game "forward" differ; π yaw shows the rabbit's back to the follow camera. */
export const RABBIT_MODEL_YAW = Math.PI;

// ─── Fox (Mr. Todd) ─────────────────────────────────────────────────────────

export const FOX_SCALE = 1.3;
export const FOX_MODEL_YAW = 0;
export const FOX_ROAM_SPEED = 0.04;
export const FOX_WAYPOINT_RADIUS = 3;
export const FOX_ROAM_RANGE = 40;
export const FOX_SPAWN_X = 12;
export const FOX_SPAWN_Z = -20;
export const FOX_VOICE_RADIUS = 8;
export const FOX_VOICE_COOLDOWN = 10;

// ─── Farmer (Mr. McGregor) ──────────────────────────────────────────────────

export const FARMER_ROAM_SPEED = 0.03;
export const FARMER_WAYPOINT_RADIUS = 3;
export const FARMER_ROAM_RANGE = 45;
export const FARMER_CATCH_RADIUS = 2;
export const FARMER_SPAWN_X = -20;
export const FARMER_SPAWN_Z = 15;
export const FARMER_SCALE = 1.4;

// ─── Mercat ─────────────────────────────────────────────────────────────────

export const MERCAT_ROAM_SPEED = 0.035;
export const MERCAT_WAYPOINT_RADIUS = 3;
export const MERCAT_ROAM_RANGE = 50;
export const MERCAT_TOUCH_RADIUS = 2.5;
export const MERCAT_VOICE_RADIUS = 15;
export const MERCAT_VOICE_COOLDOWN = 10;
export const MERCAT_SPAWN_X = 15;
export const MERCAT_SPAWN_Z = 20;
export const MERCAT_SCALE = 1;
export const SPEED_BOOST_MULTIPLIER = 2.5;
export const SPEED_BOOST_DURATION = 3;

// ─── Jeremy Fisher (frog) ───────────────────────────────────────────────────

export const FROG_SCALE = 0.12;
export const FROG_SPAWN_X = -58;
export const FROG_SPAWN_Z = 48;
export const FROG_SPEECH_RADIUS = 10;
export const FROG_VOICE_RADIUS = 10;
export const FROG_VOICE_COOLDOWN = 15;

// ─── Quinn Rabbit ───────────────────────────────────────────────────────────

export const QUINN_SCALE = 1.0;
export const QUINN_VOICE_RADIUS = 10;
export const QUINN_VOICE_COOLDOWN = 15;
export const QUINN_SPAWN_X = 30;
export const QUINN_SPAWN_Z = -35;

// ─── Pond ───────────────────────────────────────────────────────────────────

export const POND_SCALE = 0.02;
export const POND_X = -55;
export const POND_Z = 45;

// ─── Chicken & fences ───────────────────────────────────────────────────────

export const CHICKEN_SCALE = 0.6;
export const FENCE_POST_HEIGHT = 1.0;
export const FENCE_SECTION_WIDTH = 1.6;

// ─── Carrot ─────────────────────────────────────────────────────────────────

export const CARROT_SCALE = 0.033;

// ─── Fishing rod ────────────────────────────────────────────────────────────

export const FISHING_ROD_SCALE = 3;
export const FISHING_ROD_PICKUP_RADIUS = 2;
export const FISHING_ROD_DELIVER_RADIUS = 4;

// ─── Jack Sharp (fish) ─────────────────────────────────────────────────────

export const JACK_SHARP_MODEL_PATH = "/models/characters/jack-sharp.glb";
export const JACK_SHARP_SCALE = 1.5;
export const JACK_SHARP_SPAWN_X = 80;
export const JACK_SHARP_SPAWN_Z = -70;
export const JACK_SHARP_SPEECH_RADIUS = 8;
export const JACK_SHARP_FIND_RADIUS = 3;

// ─── Unicorn (Ado's Sister) ─────────────────────────────────────────────────

export const UNICORN_MODEL_PATH = "/models/characters/unicorn.glb";
export const UNICORN_SCALE = 0.6;
export const UNICORN_SPAWN_X = 70;
export const UNICORN_SPAWN_Z = 60;
export const UNICORN_SPEECH_RADIUS = 10;
export const UNICORN_VOICE_PATH = "/audio/voiceover/ados-sister.mp3";
export const UNICORN_VOICE_RADIUS = 10;
export const UNICORN_VOICE_COOLDOWN = 15;
export const STAR_COUNT = 5;
export const STAR_COLLECT_RADIUS = 2;

// ─── Fred (baby dinosaur) ───────────────────────────────────────────────────

export const DINO_MODEL_PATH = "/models/characters/dinosaur.glb";
export const DINO_SCALE = 0.6;
export const DINO_SPAWN_X = -40;
export const DINO_SPAWN_Z = -60;
export const DINO_SPEECH_RADIUS = 10;

// ─── Lily Rabbit (companion) ────────────────────────────────────────────────

export const LILY_MODEL_PATH = "/models/characters/lily-rabbit.glb";
export const LILY_SCALE = 0.05;
export const LILY_Y_OFFSET = -0.5;
/** Distance Lily tries to maintain behind Peter. */
export const LILY_FOLLOW_DISTANCE = 3.5;
/** Lily catches up faster as the gap grows; this is the lerp factor at default gap. */
export const LILY_FOLLOW_SMOOTHING = 2.5;
/** Walk animation only plays when Lily is moving faster than this (units/sec). */
export const LILY_WALK_THRESHOLD = 0.5;

// ─── Spider (friendly birthday spider) ──────────────────────────────────────

export const SPIDER_MODEL_PATH = "/models/characters/spider.glb";
export const SPIDER_SCALE = 5.0;
export const SPIDER_SPAWN_X = -80;
export const SPIDER_SPAWN_Z = -40;
export const SPIDER_SPEECH_RADIUS = 10;
export const SPIDER_CIRCLE_RADIUS = 2;
export const SPIDER_CIRCLE_SPEED = 1.2;

// ─── Procedural walk animation fallback ─────────────────────────────────────

export const PROC_WALK_FREQ = 10;
export const PROC_WALK_ROLL = 0.07;
export const PROC_WALK_PITCH = 0.05;
export const PROC_WALK_BOB_Y = 0.04;
