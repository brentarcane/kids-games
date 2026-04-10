import { useFrame } from "@react-three/fiber";
import { type RefObject, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface RoamingNPCOptions {
  spawnX: number;
  spawnZ: number;
  spawnY: number;
  roamSpeed: number;
  roamRange: number;
  waypointRadius: number;
}

function pickWaypoint(range: number): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * range;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

/**
 * Handles common NPC roaming behaviour: spawn at a position, pick random
 * waypoints, move toward them, face movement direction.
 *
 * Returns { groupRef } — attach this to the NPC's outer <group>.
 * The `onFrame` callback fires each frame with (delta, groupPos) so callers
 * can layer collision / voice logic on top.
 */
export function useRoamingNPC(
  opts: RoamingNPCOptions,
  paused: boolean,
  onFrame?: (
    delta: number,
    npcPos: THREE.Vector3,
    rabbitRef: RefObject<THREE.Group | null>,
  ) => void,
  rabbitRef?: RefObject<THREE.Group | null>,
) {
  const groupRef = useRef<THREE.Group>(null);
  const waypoint = useRef<[number, number]>(pickWaypoint(opts.roamRange));
  const _look = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(opts.spawnX, opts.spawnY, opts.spawnZ);
  }, [opts.spawnX, opts.spawnY, opts.spawnZ]);

  useFrame((_, delta) => {
    const npc = groupRef.current;
    if (!npc || paused) return;

    if (onFrame && rabbitRef) {
      onFrame(delta, npc.position, rabbitRef);
    }

    let nx = npc.position.x;
    let nz = npc.position.z;
    const [wx, wz] = waypoint.current;

    const dx = wx - nx;
    const dz = wz - nz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < opts.waypointRadius) {
      waypoint.current = pickWaypoint(opts.roamRange);
      return;
    }

    nx += (dx / dist) * opts.roamSpeed;
    nz += (dz / dist) * opts.roamSpeed;

    npc.position.x = nx;
    npc.position.z = nz;

    _look.set(wx, npc.position.y, wz);
    npc.lookAt(_look);
  });

  return { groupRef };
}
