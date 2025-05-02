export interface TrackedPoint {
  id: number;
  x: number;
  y: number;
  velocity?: [number, number];
  bearing?: number;
  range?: number;
}

export interface Circle {
  center: {
    x: number;
    y: number;
  };
  detectionRange: number;
}

export interface Line {
  from: {
    x: number;
    y: number;
  };
  to: {
    x: number;
    y: number;
  };
  thickness: number;
}
