"use client";

import {
  PLATFORM_DEPTH,
  PLATFORM_SIDE_COLOR,
  PLATFORM_THICKNESS,
  PLATFORM_TOP_COLOR,
} from "../constants";
import type { Platform as PlatformType } from "../types";

/**
 * A grass-topped earth block. Two stacked boxes:
 *   - thin grass cap on top (the actual collision surface)
 *   - thicker dirt body underneath that hangs down into the void below
 */
export function Platform({ platform }: { platform: PlatformType }) {
  const grassH = 0.4;
  const dirtH = PLATFORM_THICKNESS;
  const cx = platform.x + platform.width / 2;
  return (
    <group>
      <mesh position={[cx, platform.y - grassH / 2, 0]} receiveShadow>
        <boxGeometry args={[platform.width, grassH, PLATFORM_DEPTH]} />
        <meshStandardMaterial color={PLATFORM_TOP_COLOR} />
      </mesh>
      <mesh position={[cx, platform.y - grassH - dirtH / 2, 0]} receiveShadow>
        <boxGeometry args={[platform.width, dirtH, PLATFORM_DEPTH]} />
        <meshStandardMaterial color={PLATFORM_SIDE_COLOR} />
      </mesh>
    </group>
  );
}
