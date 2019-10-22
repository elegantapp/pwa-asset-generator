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

const launchSystemBrowser = async (): Promise<LaunchedChrome> => {
  const launchOptions: ChromeLauncherOptions = {
    chromeFlags: constants.PUPPETEER_LAUNCH_ARGS,
    logLevel: 'silent',
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

  const browser = await puppeteer.connect({
    ...launchArgs,
    browserWSEndpoint: chromeVersionInfo.webSocketDebuggerUrl,
  });

  browser.on('disconnected', () => {
    // Silently try killing chrome
    chrome.kill().catch();
  });

  return browser;
};

const getBrowserInstance = async (
  launchArgs?: LaunchOptions,
): Promise<Browser> => {
  let browser: Browser;

  try {
    const chrome = await launchSystemBrowser();
    browser = await getSystemBrowserInstance(chrome, launchArgs);
  } catch (e) {
    browser = await getLocalBrowserInstance(launchArgs);
  }

  return browser;
};

export default {
  getBrowserInstance,
};
