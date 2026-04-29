export type Ring = {
  id: number;
  x: number;
  y: number;
  z: number;
  /** Yaw in radians — controls which way the ring faces. */
  yaw: number;
  passed: boolean;
};
