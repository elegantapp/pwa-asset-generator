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

const buildDeviceRows = (count = 32): string =>
  Array.from({ length: count }, (_, i) => {
    const device = i % 2 === 0 ? `iPhone Test ${i}` : `iPad Test ${i}`;
    const widthPt = 300 + i;
    const heightPt = 600 + i;
    const scaleFactor = 2;
    return `<tr><td>${device}</td><td>${widthPt} x ${heightPt} pt (${
      widthPt * scaleFactor
    } x ${heightPt * scaleFactor} px @${scaleFactor}x)</td></tr>`;
  }).join('');

const stubDocument = (body: string): void => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${body}</body></html>`);

  // jsdom doesn't implement layout, so innerText isn't computed - fall back
  // to textContent, which is equivalent for these plain-text fixtures.
  Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent;
    },
  });

  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('Node', dom.window.Node);
};

// Drives the real in-page scraping logic against a sequence of fixture pages -
// one per source in APPLE_HIG_SPLASH_SCR_SPECS_URLS - by swapping the stubbed
// global document on every navigation. evaluate() runs the actual callback, so
// these tests exercise locateTable()/parsing rather than a canned mock result.
const createScrapingBrowser = (
  bodies: string[],
): { browser: Browser; gotoTargets: string[] } => {
  const gotoTargets: string[] = [];
  let index = 0;
  const page = {
    setUserAgent: vi.fn(),
    goto: vi.fn((target: string) => {
      gotoTargets.push(target);
      stubDocument(bodies[index] ?? '');
      index += 1;
    }),
    evaluate: vi.fn((fn: (arg: string) => unknown, arg: string) => fn(arg)),
    close: vi.fn(),
  };

  return {
    browser: { newPage: vi.fn().mockResolvedValue(page) } as unknown as Browser,
    gotoTargets,
  };
};

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
    const { browser } = createScrapingBrowser([
      `<h2 id="unrelated-heading-id">iOS, iPadOS device screen dimensions</h2>
       <table><tbody>${buildDeviceRows()}</tbody></table>`,
    ]);

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

  test('scrape: true succeeds from a later source when the first Apple page no longer carries the table', async () => {
    // GH-1276: Apple dropped the dimensions table from the canonical `layout`
    // page, leaving it rendered with unrelated tables only. Scraping must not
    // stop at the first source - it walks constants.APPLE_HIG_SPLASH_SCR_SPECS_URLS
    // and keeps the first page that yields a valid device table.
    const pages = [
      // Source 1: rendered, but only unrelated tables (what layout/ looks like today)
      `<h1>Layout</h1>
       <h2 id="Platform-considerations">Platform considerations</h2>
       <table><thead><tr><th>Attribute</th><th>Value</th></tr></thead>
         <tbody><tr><td>Unfocused content width</td><td>860 pt</td></tr></tbody></table>`,
      // Source 2: the dimensions table, under a heading the id selector misses
      `<h2 id="some-new-id">iOS, iPadOS device screen dimensions</h2>
       <table><tbody>${buildDeviceRows()}</tbody></table>`,
    ];

    const { browser, gotoTargets } = createScrapingBrowser(pages);

    try {
      const result = await puppets.getSplashScreenMetaData(
        { scrape: true } as Options,
        browser,
      );

      // Proves the first source was tried and rejected before the second won
      expect(gotoTargets).toEqual(
        constants.APPLE_HIG_SPLASH_SCR_SPECS_URLS.slice(0, 2),
      );
      expect(result).toHaveLength(32);
      expect(result.some((d) => /iphone/i.test(d.device))).toBe(true);
      expect(result.some((d) => /ipad/i.test(d.device))).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test('reports every source it tried when none of them carry the table', async () => {
    const renderedButUnrelated = `<h1>Layout</h1>
      <table><thead><tr><th>Date</th><th>Changes</th></tr></thead>
        <tbody><tr><td>September 9, 2026</td><td>Updated guidance.</td></tr></tbody></table>`;

    const { browser, gotoTargets } = createScrapingBrowser(
      constants.APPLE_HIG_SPLASH_SCR_SPECS_URLS.map(() => renderedButUnrelated),
    );

    try {
      // getSplashScreenMetaData degrades to static data, so assert on the
      // underlying scraper to see the aggregated failure message.
      await expect(
        puppets.getAppleSplashScreenData(browser, { scrape: true } as Options),
      ).rejects.toThrow(/Tried 3 source\(s\)/);

      expect(gotoTargets).toEqual(constants.APPLE_HIG_SPLASH_SCR_SPECS_URLS);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
