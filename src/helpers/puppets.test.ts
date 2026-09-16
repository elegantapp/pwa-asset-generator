import { vi, describe, test, expect, afterEach } from 'vitest';
import puppets from './puppets.js';
import constants from '../config/constants.js';
import type { LaunchScreenSpec } from '../models/spec.js';
import type { Options } from '../models/options.js';

vi.mock('node:os', () => ({
  default: {
    cpus: () => Array.from({ length: 8 }),
    freemem: () => 8 * 1024 * 1024 * 1024, // 8 GB
    homedir: () => '/tmp',
  },
}));

const logger = vi.hoisted(() => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('./logger.js', () => ({
  default: () => logger,
}));

afterEach(() => {
  delete process.env.PAG_SIMULATE_CPU_COUNT;
  delete process.env.PAG_SIMULATE_FREE_MEM_MB;
  vi.clearAllMocks();
});

describe('getOptimalConcurrency', () => {
  test('returns 0 when imageCount is 0', () => {
    expect(puppets.getOptimalConcurrency(0)).toBe(0);
  });

  test('caps concurrency at imageCount when imageCount < cpuCount', () => {
    // 8 CPUs mocked, but only 3 images
    expect(puppets.getOptimalConcurrency(3)).toBe(3);
  });

  test('clamps to 1 when memory is too constrained', () => {
    process.env.PAG_SIMULATE_CPU_COUNT = '8';
    process.env.PAG_SIMULATE_FREE_MEM_MB = '100'; // <150MB per context → memoryBasedLimit rounds to 0
    expect(puppets.getOptimalConcurrency(100)).toBe(1);
  });

  test('uses CPU count as primary driver under ample memory', () => {
    process.env.PAG_SIMULATE_CPU_COUNT = '4';
    process.env.PAG_SIMULATE_FREE_MEM_MB = '8192';
    expect(puppets.getOptimalConcurrency(100)).toBe(4);
  });

  test('caps at memory limit when memory is more constrained than CPUs', () => {
    process.env.PAG_SIMULATE_CPU_COUNT = '8';
    process.env.PAG_SIMULATE_FREE_MEM_MB = '512'; // floor(512*0.8/150) = 2
    expect(puppets.getOptimalConcurrency(100)).toBe(2);
  });

  test('throws on non-numeric PAG_SIMULATE_CPU_COUNT', () => {
    process.env.PAG_SIMULATE_CPU_COUNT = 'abc';
    expect(() => puppets.getOptimalConcurrency(10)).toThrow(
      'PAG_SIMULATE_CPU_COUNT must be a valid number, got: "abc"',
    );
  });

  test('throws on non-numeric PAG_SIMULATE_FREE_MEM_MB', () => {
    process.env.PAG_SIMULATE_FREE_MEM_MB = 'abc';
    expect(() => puppets.getOptimalConcurrency(10)).toThrow(
      'PAG_SIMULATE_FREE_MEM_MB must be a valid number, got: "abc"',
    );
  });

  test('handles PAG_SIMULATE_CPU_COUNT=0 without NaN (clamps to 1)', () => {
    process.env.PAG_SIMULATE_CPU_COUNT = '0';
    process.env.PAG_SIMULATE_FREE_MEM_MB = '8192';
    expect(puppets.getOptimalConcurrency(10)).toBe(1);
  });
});

describe('getSplashScreenMetaData', () => {
  const specs =
    constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA as LaunchScreenSpec[];

  test('returns the bundled Apple device specs when scrape is false', () => {
    const result = puppets.getSplashScreenMetaData({
      scrape: false,
    } as Options);

    expect(result).toEqual(specs);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test('scrape: true is a deprecated no-op that still returns the bundled specs', () => {
    // GH-1276: Apple removed the iOS/iPadOS device screen dimensions table from
    // its Human Interface Guidelines, so there is nothing left to scrape. The
    // option is still accepted for backwards compatibility, but it must never
    // hit the network - hence no browser is passed in or used at all.
    const result = puppets.getSplashScreenMetaData({ scrape: true } as Options);

    expect(result).toEqual(specs);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('scrape option is deprecated'),
    );
  });

  test('bundled specs cover both iPhone and iPad with usable dimensions', () => {
    // Guards the hand-maintained apple-fallback-data.json: it is now the single
    // source of truth, so a truncated or malformed edit must fail loudly here.
    expect(specs.length).toBeGreaterThanOrEqual(30);
    expect(specs.some((d) => /iphone/i.test(d.device))).toBe(true);
    expect(specs.some((d) => /ipad/i.test(d.device))).toBe(true);
    expect(
      specs.every(
        (d) =>
          d.portrait.width > 0 &&
          d.portrait.height > 0 &&
          d.landscape.width === d.portrait.height &&
          d.landscape.height === d.portrait.width &&
          d.scaleFactor > 0,
      ),
    ).toBe(true);
  });
});
