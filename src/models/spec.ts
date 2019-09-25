export type Dimension = { width: number; height: number };

export interface LaunchScreenSpec {
  device: string;
  portrait: Dimension;
  landscape: Dimension;
}

export interface DeviceFactorSpec {
  device: string;
  scaleFactor: number;
}

export interface SplashScreenSpec extends DeviceFactorSpec, LaunchScreenSpec {}
