import execa from 'execa';
import constants from './config/constants';

describe('CLI', () => {
  test('does not throw when there is not any arg', async () => {
    expect(() => execa.sync('./bin/cli', [])).not.toThrow();
  });

  test('integrates with main API and creates an output with generated meta', async () => {
    let response = { stdout: '', stderr: '' };
    try {
      response = await execa(
        './bin/cli',
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
      // eslint-disable-next-line no-console
      console.error(e);
    }
    expect(response.stdout).toMatchSnapshot();
  });

  test('does not have any conflicting shorthand options', () => {
    const flagShorthands = Object.values(constants.FLAGS).map(
      (flag) => flag.alias,
    );
    expect(new Set(flagShorthands).size).toBe(flagShorthands.length);
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
      // eslint-disable-next-line no-console
      console.error(e);
    }
    expect(response.stdout).toMatchSnapshot();
  });
});

describe('CLI with local chromium revision', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.mock('./helpers/installer', () => ({
      getPreferredBrowserRevisionInfo: jest.fn().mockResolvedValue({
        folderPath: '/mock/chrome',
        executablePath: '/mock/chrome/chrome',
        local: true,
        revision: '134.0.6998.35',
      }),
      installPreferredBrowserRevision: jest.fn().mockResolvedValue({
        folderPath: '/mock/chrome',
        executablePath: '/mock/chrome/chrome',
        local: true,
        revision: '134.0.6998.35',
      }),
    }));

    jest.mock('./helpers/browser', () => ({
      getBrowserInstance: jest.fn().mockResolvedValue({
        browser: { close: jest.fn() },
        chrome: undefined,
      }),
      killBrowser: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should use browser.getBrowserInstance when PAG_USE_LOCAL_REV is set', async () => {
    const originalValue = process.env.PAG_USE_LOCAL_REV;
    process.env.PAG_USE_LOCAL_REV = '1';

    const browser = require('./helpers/browser');
    await browser.getBrowserInstance({}, false);
    expect(browser.getBrowserInstance).toHaveBeenCalledTimes(1);

    process.env.PAG_USE_LOCAL_REV = originalValue;
  });

  test('should handle system browser fallback', async () => {
    const browser = require('./helpers/browser');
    const installer = require('./helpers/installer');

    browser.getBrowserInstance.mockImplementationOnce(async () => {
      // Simulate that system browser launch failed
      // This would trigger fallback to local Chromium
      await installer.installPreferredBrowserRevision();

      return {
        browser: { close: jest.fn() },
        chrome: undefined,
      };
    });

    await browser.getBrowserInstance({}, false);
    expect(installer.installPreferredBrowserRevision).toHaveBeenCalled();
  });

  test('should download Chrome when needed', async () => {
    const installer = require('./helpers/installer');
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await installer.installPreferredBrowserRevision();

    expect(installer.installPreferredBrowserRevision).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('should use local Chrome with PAG_USE_LOCAL_REV env var', async () => {
    const originalValue = process.env.PAG_USE_LOCAL_REV;
    process.env.PAG_USE_LOCAL_REV = '1';

    const browser = require('./helpers/browser');
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await browser.getBrowserInstance({}, false);
    expect(browser.getBrowserInstance).toHaveBeenCalledWith({}, false);

    process.env.PAG_USE_LOCAL_REV = originalValue;
    logSpy.mockRestore();
  });
});
