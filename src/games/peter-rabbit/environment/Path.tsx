"use client";

export function Path() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[18, 20, 64]} />
      <meshStandardMaterial color="#c9a96e" />
    </mesh>
  );
}
