export type Carrot = { id: number; x: number; z: number; collected: boolean };

export type Star = { id: number; x: number; z: number; collected: boolean };

export type TreeData = {
  x: number;
  z: number;
  scale: number;
  trunkHeight: number;
  leafRadius: number;
};

export type FlowerData = { x: number; z: number; color: string };

export type RockData = { x: number; z: number; scale: number };

export type GardenData = {
  x: number;
  z: number;
  rotation: number;
  width: number;
  depth: number;
  chickens: { cx: number; cz: number; facing: number }[];
};
