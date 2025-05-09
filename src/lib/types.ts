export interface TrackedPoint {
  id: number;
  x: number;
  y: number;
  velocity?: [number, number];
  bearing?: number;
  range?: number;
}

export interface BasicShape {
  id: number;
  type: string;
}

export interface Circle extends BasicShape {
  type: "circle";
  center: {
    x: number;
    y: number;
  };
  detectionRange: number;
}
export interface Line extends BasicShape {
  type: "line";
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

export type Shape = Circle | Line;
