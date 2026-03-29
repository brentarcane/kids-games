import { useCallback, useRef } from "react";
import * as THREE from "three";

/** Reusable hook: plays an audio file when the rabbit enters a radius,
 *  with a cooldown between triggers and distance-based volume falloff. */
export function useProximityVoice(
  src: string,
  opts: { radius: number; cooldown: number },
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef(0);

  const update = useCallback(
    (delta: number, distSq: number) => {
      if (cooldownRef.current > 0) cooldownRef.current -= delta;

      const radiusSq = opts.radius * opts.radius;

      if (cooldownRef.current <= 0 && distSq < radiusSq) {
        cooldownRef.current = opts.cooldown;
        if (!audioRef.current) {
          audioRef.current = new Audio(src);
        }
        const audio = audioRef.current;
        audio.currentTime = 0;
        audio.volume = 1;
        audio.play().catch(() => {});
      }

      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const dist = Math.sqrt(distSq);
        const fadeEnd = opts.radius * 3;
        audio.volume = THREE.MathUtils.clamp(
          1 - (dist - opts.radius) / (fadeEnd - opts.radius),
          0,
          1,
        );
      }
    },
    [src, opts.radius, opts.cooldown],
  );

  return update;
}
