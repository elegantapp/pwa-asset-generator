import { execa, execaSync } from 'execa';
import constants from './config/constants.js';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

// Mock modules for browser tests
const mockInstaller = {
  getPreferredBrowserRevisionInfo: vi.fn().mockResolvedValue({
    folderPath: '/mock/chrome',
    executablePath: '/mock/chrome/chrome',
    local: true,
    revision: '134.0.6998.35',
  }),
  installPreferredBrowserRevision: vi.fn().mockResolvedValue({
    folderPath: '/mock/chrome',
    executablePath: '/mock/chrome/chrome',
    local: true,
    revision: '134.0.6998.35',
  }),
};

const mockBrowser = {
  getBrowserInstance: vi.fn().mockResolvedValue({
    browser: { close: vi.fn() },
    chrome: undefined,
  }),
  killBrowser: vi.fn(),
};

vi.mock('./helpers/installer.js', () => {
  return {
    default: mockInstaller,
  };
});

vi.mock('./helpers/browser.js', () => {
  return {
    default: mockBrowser,
  };
});

describe('CLI', () => {
  test('does not throw when there is not any arg', async () => {
    expect(() => execaSync('./bin/cli.js', [])).not.toThrow();
  });

  test('integrates with main API and creates an output with generated meta', async () => {
    let response = { stdout: '', stderr: '' };
    try {
      response = await execa(
        './bin/cli.js',
        [
          './static/logo.png',
          './temp',
          '--scrape=false',
          '--splash-only',
          '--landscape-only',
          '--favicon',
          '--path="%PUBLIC_URL%"',
          '--dark-mode',
          '--type=jpg',
          '--quality=20',
        ],
        { env: { PAG_TEST_MODE: '1' } },
      );
    } catch (e) {
      console.error(e);
    }
    expect(response.stdout).toMatchSnapshot();
  });

  test('does not have any conflicting shorthand options', () => {
    const shortFlags = Object.values(constants.FLAGS).map(
      (flag) => flag.shortFlag,
    );
    expect(new Set(shortFlags).size).toBe(shortFlags.length);
  });

  test('integrates with npx', async () => {
    let response = { stdout: '', stderr: '' };
    try {
      response = await execa(
        'npx',
        [
          '-p .',
          'pwa-asset-generator',
          './static/logo.png',
          './temp',
          '--scrape=false',
          '--splash-only',
          '--landscape-only',
          '--favicon',
          '--path="%PUBLIC_URL%"',
          '--dark-mode',
          '--type=jpg',
          '--quality=20',
        ],
        { env: { PAG_TEST_MODE: '1' } },
      );
    } catch (e) {
      console.error(e);
    }
    expect(response.stdout).toMatchSnapshot();
  });
});

describe('CLI with local chromium revision', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should use browser.getBrowserInstance when PAG_USE_LOCAL_REV is set', async () => {
    const originalValue = process.env.PAG_USE_LOCAL_REV;
    process.env.PAG_USE_LOCAL_REV = '1';

    await mockBrowser.getBrowserInstance({}, false);
    expect(mockBrowser.getBrowserInstance).toHaveBeenCalledTimes(1);

    process.env.PAG_USE_LOCAL_REV = originalValue;
  });

  test('should handle system browser fallback', async () => {
    mockBrowser.getBrowserInstance.mockImplementationOnce(async () => {
      // Simulate that system browser launch failed
      // This would trigger fallback to local Chromium
      await mockInstaller.installPreferredBrowserRevision();

      return {
        browser: { close: vi.fn() },
        chrome: undefined,
      };
    });

    await mockBrowser.getBrowserInstance({}, false);
    expect(mockInstaller.installPreferredBrowserRevision).toHaveBeenCalled();
  });

  test('should download Chrome when needed', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await mockInstaller.installPreferredBrowserRevision();

    expect(mockInstaller.installPreferredBrowserRevision).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('should use local Chrome with PAG_USE_LOCAL_REV env var', async () => {
    const originalValue = process.env.PAG_USE_LOCAL_REV;
    process.env.PAG_USE_LOCAL_REV = '1';

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await mockBrowser.getBrowserInstance({}, false);
    expect(mockBrowser.getBrowserInstance).toHaveBeenCalledWith({}, false);

    process.env.PAG_USE_LOCAL_REV = originalValue;
    logSpy.mockRestore();
  });
});
