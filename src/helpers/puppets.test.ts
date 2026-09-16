import { vi, describe, test, expect, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import puppets from './puppets.js';
import constants from '../config/constants.js';
import type { Browser } from 'puppeteer-core';
import type { Options } from '../models/options.js';

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

describe('getSplashScreenMetaData', () => {
  test('returns static fallback data without scraping when scrape is false', async () => {
    const browser = {
      newPage: vi.fn(),
    } as unknown as Browser;

    const result = await puppets.getSplashScreenMetaData(
      { scrape: false } as Options,
      browser,
    );

    expect(result).toEqual(constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA);
    expect(browser.newPage).not.toHaveBeenCalled();
  });

  test('falls back to static data when scrape is true but scraping fails', async () => {
    const browser = {
      newPage: vi
        .fn()
        .mockRejectedValue(
          new Error(
            'Could not locate the iOS/iPadOS device screen dimensions table',
          ),
        ),
    } as unknown as Browser;

    const result = await puppets.getSplashScreenMetaData(
      { scrape: true } as Options,
      browser,
    );

    expect(result).toEqual(constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA);
  });

  test('scrape: true successfully parses device data via the heading-match fallback selector strategy', async () => {
    // Simulates Apple renaming/removing the known table id (as happened in
    // GH-1276) while keeping the "iOS, iPadOS device screen dimensions"
    // heading text intact elsewhere on the page. This exercises the real
    // locateTable() fallback logic inside getAppleSplashScreenData, not a
    // canned mock result - the id selector deliberately fails so strategy 2
    // (heading text -> first following table) is what produces the data.
    const rows = Array.from({ length: 32 }, (_, i) => {
      const device = i % 2 === 0 ? `iPhone Test ${i}` : `iPad Test ${i}`;
      const widthPt = 300 + i;
      const heightPt = 600 + i;
      const scaleFactor = 2;
      const widthPx = widthPt * scaleFactor;
      const heightPx = heightPt * scaleFactor;
      return `<tr><td>${device}</td><td>${widthPt} x ${heightPt} pt (${widthPx} x ${heightPx} px @${scaleFactor}x)</td></tr>`;
    }).join('');

    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <h2 id="unrelated-heading-id">iOS, iPadOS device screen dimensions</h2>
      <table><tbody>${rows}</tbody></table>
    </body></html>`);

    // jsdom doesn't implement layout, so innerText isn't computed - fall back
    // to textContent, which is equivalent for this plain-text fixture.
    Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent;
      },
    });

    vi.stubGlobal('document', dom.window.document);
    vi.stubGlobal('Node', dom.window.Node);

    const page = {
      setUserAgent: vi.fn(),
      goto: vi.fn(),
      evaluate: vi.fn((fn: (arg: string) => unknown, arg: string) => fn(arg)),
      close: vi.fn(),
    };
    const browser = {
      newPage: vi.fn().mockResolvedValue(page),
    } as unknown as Browser;

    try {
      const result = await puppets.getSplashScreenMetaData(
        { scrape: true } as Options,
        browser,
      );

      expect(result).toHaveLength(32);
      expect(result.some((d) => /iphone/i.test(d.device))).toBe(true);
      expect(result.some((d) => /ipad/i.test(d.device))).toBe(true);
      expect(result[0]).toMatchObject({
        device: 'iPhone Test 0',
        portrait: { width: 600, height: 1200 },
        landscape: { width: 1200, height: 600 },
        scaleFactor: 2,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
