"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { WORLD_RADIUS } from "../constants";

const WALL_HEIGHT = 60;
const BG_PATH = "/games/peter-rabbit/images/bg-3.jpg";

export function SkyWall() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.load(BG_PATH, (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
    return () => {
      disposed = true;
    };
  }, []);

  if (!texture) return null;

  return (
    <mesh position={[0, WALL_HEIGHT / 2 - 1, 0]}>
      <cylinderGeometry args={[WORLD_RADIUS, WORLD_RADIUS, WALL_HEIGHT, 64, 1, true]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}
