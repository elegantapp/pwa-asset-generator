import puppeteer, {
  Browser,
  type LaunchOptions,
  type ConnectOptions,
} from 'puppeteer-core';
import {
  launch,
  LaunchedChrome,
  Options as ChromeLauncherOptions,
} from 'chrome-launcher';
import find from 'find-process';
import { get } from 'http';
import preLogger from './logger.js';
import constants from '../config/constants.js';
import installer from './installer.js';

// Used for both launch and connect options
type PuppeteerOptions = LaunchOptions & ConnectOptions;

interface BrowserVersionInfo {
  Browser: string;
  webSocketDebuggerUrl: string;
  'Protocol-Version': string;
  'User-Agent': string;
  'V8-Version': string;
  'Webkit-Version': string;
}

const getLocalRevisionInfo = async (): Promise<
  | {
      folderPath: string;
      executablePath: string;
      local: boolean;
      revision: string;
    }
  | undefined
> => {
  const revisionInfo = await installer.getPreferredBrowserRevisionInfo();
  if (revisionInfo.local) {
    return revisionInfo;
  }

  return undefined;
};

const getLocalBrowserInstance = async (
  launchArgs: PuppeteerOptions,
  noSandbox: boolean,
): Promise<Browser> => {
  let revisionInfo;
  const localRevisionInfo = await getLocalRevisionInfo();

  if (localRevisionInfo) {
    revisionInfo = localRevisionInfo;
  } else {
    revisionInfo = await installer.installPreferredBrowserRevision();
  }

  return puppeteer.launch({
    ...launchArgs,
    ...(noSandbox && {
      args: [
        ...(launchArgs.args ?? []),
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    }),
    executablePath: revisionInfo.executablePath,
    protocolTimeout: 2 * 60 * 1000,
  });
};

const launchSystemBrowser = (): Promise<LaunchedChrome> => {
  const launchOptions: ChromeLauncherOptions = {
    chromeFlags: constants.CHROME_LAUNCH_ARGS,
    userDataDir: false,
    logLevel: 'silent',
    maxConnectionRetries: constants.CHROME_LAUNCHER_MAX_CONN_RETRIES,
  };

  return launch(launchOptions);
};

const getLaunchedChromeVersionInfo = (
  chrome: LaunchedChrome,
): Promise<BrowserVersionInfo> =>
  new Promise((resolve, reject) => {
    get(`http://localhost:${chrome.port}/json/version`, (res) => {
      let data = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => reject(err));
  });

const getSystemBrowserInstance = async (
  chrome: LaunchedChrome,
  launchArgs?: PuppeteerOptions,
): Promise<Browser> => {
  const chromeVersionInfo = await getLaunchedChromeVersionInfo(chrome);

  return puppeteer.connect({
    ...launchArgs,
    browserWSEndpoint: chromeVersionInfo.webSocketDebuggerUrl,
  });
};

const getBrowserInstance = async (
  launchArgs: PuppeteerOptions,
  noSandbox: boolean,
): Promise<{ chrome: LaunchedChrome | undefined; browser: Browser }> => {
  const LAUNCHER_CONNECTION_REFUSED_ERROR_CODE = 'ECONNREFUSED';
  const LAUNCHER_NOT_INSTALLED_ERROR_CODE = 'ERR_LAUNCHER_NOT_INSTALLED';
  const logger = preLogger(getBrowserInstance.name);

  let browser: Browser;
  let chrome: LaunchedChrome | undefined;

  // Check if user wants to force using the local Chromium revision
  const useLocalRev = process.env.PAG_USE_LOCAL_REV === '1';
  const useNoSandbox = process.env.PAG_USE_NO_SANDBOX === '1';

  if (useLocalRev) {
    logger.log(
      'Using local Chromium revision as requested via PAG_USE_LOCAL_REV',
    );
    browser = await getLocalBrowserInstance(
      launchArgs,
      useNoSandbox || noSandbox,
    );
    return { browser, chrome };
  }

  // First try to use system Chrome browser
  // If that fails, we'll fall back to the puppeteer-core compatible version
  try {
    chrome = await launchSystemBrowser();
    browser = await getSystemBrowserInstance(chrome, launchArgs);
  } catch (e) {
    const error = e as { port: number; code: string };
    // Kill chrome instance manually in case of connection error
    if (error.code === LAUNCHER_CONNECTION_REFUSED_ERROR_CODE) {
      logger.warn(
        `Chrome launcher could not connect to your system browser. Is your port ${error.port} accessible?`,
      );
      const prc = await find('port', error.port);
      prc.forEach((pr) => {
        logger.log(
          `Killing incompletely launched system chrome instance on pid ${pr.pid}`,
        );
        process.kill(pr.pid);
      });
    }

    // Inform user that system chrome is not found
    if (error.code === LAUNCHER_NOT_INSTALLED_ERROR_CODE) {
      logger.warn('Looks like Chrome is not installed on your system');
    }

    // Fall back to local Chromium version via installer
    // This will either use an already installed local version or download the required one
    browser = await getLocalBrowserInstance(launchArgs, noSandbox);
  }

  return { browser, chrome };
};

export const killBrowser = async (
  browser: Browser,
  chrome: LaunchedChrome | undefined,
): Promise<void> => {
  if (chrome) {
    await browser.disconnect();
    await browser.close();
    chrome.kill();
  } else {
    await browser.close();
  }
};

export default {
  getBrowserInstance,
  killBrowser,
};
