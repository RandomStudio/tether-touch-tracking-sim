export interface TrackedPoint {
  id: number;
  x: number;
  y: number;
  velocity?: [number, number];
  angle?: number;
}
