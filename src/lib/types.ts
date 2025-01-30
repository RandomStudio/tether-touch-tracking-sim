export interface TrackedPoint {
  id: number;
  x: number;
  y: number;
  velocity?: [number, number];
  bearing?: number;
  range?: number;
}
