import { vi, describe, test, expect, afterEach } from 'vitest';
import puppets from './puppets.js';

vi.mock('node:os', () => ({
  default: {
    cpus: () => Array.from({ length: 8 }),
    freemem: () => 8 * 1024 * 1024 * 1024, // 8 GB
    homedir: () => '/tmp',
  },
}));

vi.mock('./logger.js', () => ({
  default: () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

afterEach(() => {
  delete process.env.PAG_SIMULATE_CPU_COUNT;
  delete process.env.PAG_SIMULATE_FREE_MEM_MB;
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
