import { Browser } from '@puppeteer/browsers';
import installer from './installer';

jest.mock('@puppeteer/browsers');
jest.mock('./logger', () => {
  const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return jest.fn().mockReturnValue(mockLogger);
});

jest.mock(
  'puppeteer-core/lib/cjs/puppeteer/revisions.js',
  () => ({
    PUPPETEER_REVISIONS: {
      chrome: '134.0.6998.35',
    },
  }),
  { virtual: true },
);

describe('Installer', () => {
  const browsers = require('@puppeteer/browsers');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferredBrowserRevisionInfo', () => {
    it('should return installed browser when matching revision is available', async () => {
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

    it('should not return installed browser with wrong revision', async () => {
      browsers.getInstalledBrowsers.mockResolvedValueOnce([
        {
          browser: Browser.CHROME,
          buildId: '133.0.0.0', // Different from the puppeteer-core revision
          path: '/path/to/chrome',
          executablePath: '/path/to/chrome/chrome',
        },
      ]);

      const result = await installer.getPreferredBrowserRevisionInfo();

      // Should return non-local info with the puppeteer-core revision
      expect(result).toEqual({
        folderPath: '',
        executablePath: '',
        local: false,
        revision: '134.0.6998.35',
      });
    });

    it('should return puppeteer-core revision info when no matching Chrome is found', async () => {
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
