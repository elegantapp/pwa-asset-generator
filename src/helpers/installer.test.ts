import { vi, describe, test, expect, beforeEach } from 'vitest';
import { Browser } from '@puppeteer/browsers';
import type { Mock } from 'vitest';
import installer from './installer.js';

vi.mock('@puppeteer/browsers', () => ({
  Browser: {
    CHROME: 'chrome',
    CHROMEHEADLESSSHELL: 'chrome-headless-shell',
  },
  getInstalledBrowsers: vi.fn(),
  computeExecutablePath: vi.fn(),
  canDownload: vi.fn(),
  install: vi.fn(),
}));

vi.mock('./logger.js', () => ({
  default: () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('puppeteer-core/lib/cjs/puppeteer/revisions.js', () => ({
  PUPPETEER_REVISIONS: {
    chrome: '134.0.6998.35',
  },
}));

interface MockedBrowsers {
  getInstalledBrowsers: Mock;
  computeExecutablePath: Mock;
  canDownload: Mock;
  install: Mock;
  Browser: typeof Browser;
}

describe('Installer', () => {
  let browsers: MockedBrowsers;

  beforeEach(async () => {
    vi.clearAllMocks();
    browsers = (await import(
      '@puppeteer/browsers'
    )) as unknown as MockedBrowsers;
  });

  describe('getPreferredBrowserRevisionInfo', () => {
    test('should return installed browser when matching revision is available', async () => {
      browsers.getInstalledBrowsers.mockResolvedValueOnce([
        {
          browser: Browser.CHROMEHEADLESSSHELL,
          buildId: '134.0.6998.35',
          path: '/path/to/chrome',
          executablePath: '/path/to/chrome/chrome',
        },
      ]);

      const result = await installer.getPreferredBrowserRevisionInfo();

      expect(result).toEqual({
        folderPath: '/path/to/chrome',
        executablePath: '/path/to/chrome/chrome',
        local: true,
        revision: '134.0.6998.35',
      });
    });

    test('should not return installed browser with wrong revision', async () => {
      browsers.getInstalledBrowsers.mockResolvedValueOnce([
        {
          browser: Browser.CHROME,
          buildId: '133.0.0.0', // Different from the puppeteer-core revision
          path: '/path/to/chrome',
          executablePath: '/path/to/chrome/chrome',
        },
      ]);

      const result = await installer.getPreferredBrowserRevisionInfo();

      expect(result).toEqual({
        folderPath: '',
        executablePath: '',
        local: false,
        revision: '134.0.6998.35',
      });
    });

    test('should return puppeteer-core revision info when no matching Chrome is found', async () => {
      browsers.getInstalledBrowsers.mockResolvedValueOnce([]);

      const result = await installer.getPreferredBrowserRevisionInfo();

      expect(result).toEqual({
        folderPath: '',
        executablePath: '',
        local: false,
        revision: '134.0.6998.35',
      });
    });
  });
});
