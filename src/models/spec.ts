export type Dimension = { width: number; height: number };

export interface LaunchScreenSpec {
  device: string;
  portrait: Dimension;
  landscape: Dimension;
  scaleFactor: number;
}
