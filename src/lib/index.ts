// place files you want to import through the `$lib` alias in this folder.

export const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export const getBearing = (x: number, y: number): number => {
  const angle_rad = Math.atan2(y, x);
  const angle_deg = toDegrees(angle_rad);

  const heading = (90 - angle_deg) % 360;
  if (heading < 0) {
    return heading + 360;
  } else {
    return heading;
  }
};

export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

export const getRangeFromOrigin = (x: number, y: number): number =>
  distance(x, y, 0, 0);
