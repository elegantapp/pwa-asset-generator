import puppeteer, {
  Browser,
  LaunchOptions,
  RevisionInfo,
} from 'puppeteer-core';
import {
  launch,
  LaunchedChrome,
  Options as ChromeLauncherOptions,
} from 'chrome-launcher';
import { get } from 'http';
import constants from '../config/constants';
import installer from './installer';

interface BrowserVersionInfo {
  Browser: string;
  webSocketDebuggerUrl: string;
  'Protocol-Version': string;
  'User-Agent': string;
  'V8-Version': string;
  'Webkit-Version': string;
}

const isPreferredBrowserRevisionInstalled = (): boolean => {
  const revisionInfo = installer.getPreferredBrowserRevisionInfo();
  return revisionInfo.local;
};

const getLocalRevisionList = (): Promise<string[]> => {
  return installer.getBrowserFetcher().localRevisions();
};

const getLocalRevisionInfo = async (): Promise<RevisionInfo | undefined> => {
  if (isPreferredBrowserRevisionInstalled()) {
    return installer.getPreferredBrowserRevisionInfo();
  }

  const localRevisions = await getLocalRevisionList();

  if (localRevisions.length > 0) {
    const lastRevision = localRevisions.pop() as string;
    return installer.getBrowserFetcher().revisionInfo(lastRevision);
  }

  return undefined;
};

const getLocalBrowserInstance = async (
  launchArgs?: LaunchOptions,
): Promise<Browser> => {
  let revisionInfo: RevisionInfo;
  const localRevisionInfo = await getLocalRevisionInfo();

  if (localRevisionInfo) {
    revisionInfo = localRevisionInfo;
  } else {
    revisionInfo = await installer.installPreferredBrowserRevision();
  }

  return puppeteer.launch({
    ...launchArgs,
    executablePath: revisionInfo.executablePath,
  });
};

const launchSystemBrowser = (): Promise<LaunchedChrome> => {
  const launchOptions: ChromeLauncherOptions = {
    chromeFlags: constants.PUPPETEER_LAUNCH_ARGS,
    logLevel: 'silent',
    port: constants.CHROME_LAUNCHER_DEBUG_PORT,
    maxConnectionRetries: constants.CHROME_LAUNCHER_MAX_CONN_RETRIES,
  };

  return launch(launchOptions);
};

const getLaunchedChromeVersionInfo = (
  chrome: LaunchedChrome,
): Promise<BrowserVersionInfo> => {
  return new Promise((resolve, reject) => {
    get(`http://localhost:${chrome.port}/json/version`, res => {
      let data = '';
      res.setEncoding('utf8');

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', err => reject(err));
  });
};

const getSystemBrowserInstance = async (
  chrome: LaunchedChrome,
  launchArgs?: LaunchOptions,
): Promise<Browser> => {
  const chromeVersionInfo = await getLaunchedChromeVersionInfo(chrome);

  return puppeteer.connect({
    ...launchArgs,
    browserWSEndpoint: chromeVersionInfo.webSocketDebuggerUrl,
  });
};

const getBrowserInstance = async (
  launchArgs?: LaunchOptions,
): Promise<{ chrome: LaunchedChrome | undefined; browser: Browser }> => {
  let browser: Browser;
  let chrome: LaunchedChrome | undefined;
  const LAUNCHER_NOT_INSTALLED_ERROR_CODE = 'ERR_LAUNCHER_NOT_INSTALLED';

  try {
    chrome = await launchSystemBrowser();
    browser = await getSystemBrowserInstance(chrome, launchArgs);
  } catch (e) {
    // Kill chrome instance if it's not possible to connect to its debuggable instance
    if (
      e.code !== LAUNCHER_NOT_INSTALLED_ERROR_CODE &&
      chrome &&
      chrome.pid > 0
    ) {
      process.kill(chrome.pid);
    }
    browser = await getLocalBrowserInstance(launchArgs);
  }

  return { browser, chrome };
};

export default {
  getBrowserInstance,
};
