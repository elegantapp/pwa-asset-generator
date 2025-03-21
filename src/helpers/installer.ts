import {
  install,
  canDownload,
  getInstalledBrowsers,
  Browser,
} from '@puppeteer/browsers';
import path from 'path';
import os from 'os';
import preLogger from './logger';

// Override current environment proxy settings with npm configuration, if any.
const NPM_HTTPS_PROXY =
  process.env.npm_config_https_proxy || process.env.npm_config_proxy;
const NPM_HTTP_PROXY =
  process.env.npm_config_http_proxy || process.env.npm_config_proxy;
const NPM_NO_PROXY = process.env.npm_config_no_proxy;

if (NPM_HTTPS_PROXY) process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
if (NPM_HTTP_PROXY) process.env.HTTP_PROXY = NPM_HTTP_PROXY;
if (NPM_NO_PROXY) process.env.NO_PROXY = NPM_NO_PROXY;

// Define default cache directory
const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.cache', 'puppeteer');

interface RevisionInfo {
  folderPath: string;
  executablePath: string;
  local: boolean;
  revision: string;
  url?: string;
}

/**
 * Get Chrome buildId from puppeteer-core's revisions.js
 * This ensures we use the exact version that is compatible with the installed puppeteer-core
 */
const getChromeBuildIdFromPuppeteer = (): string => {
  const logger = preLogger('installer');

  try {
    // Try to load PUPPETEER_REVISIONS from puppeteer-core
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      PUPPETEER_REVISIONS,
    } = require('puppeteer-core/lib/cjs/puppeteer/revisions.js');

    if (!PUPPETEER_REVISIONS || !PUPPETEER_REVISIONS.chrome) {
      throw new Error('Could not find chrome revision in puppeteer-core');
    }

    return PUPPETEER_REVISIONS.chrome;
  } catch (error: unknown) {
    // If we can't find the revision, this is a fatal error
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to get Chrome buildId from puppeteer-core: ${errorMessage}`,
    );
    throw new Error(
      `Failed to get Chrome buildId from puppeteer-core: ${errorMessage}`,
    );
  }
};

const getPreferredBrowserRevisionInfo = async (): Promise<RevisionInfo> => {
  const logger = preLogger('installer');
  const buildId = getChromeBuildIdFromPuppeteer();

  // Check if we already have this version installed locally
  try {
    const installedBrowsers = await getInstalledBrowsers({
      cacheDir: DEFAULT_CACHE_DIR,
    });

    // Find a Chrome with the specific buildId from puppeteer-core
    const preferredBrowser = installedBrowsers.find(
      (browser) =>
        browser.browser === Browser.CHROMEHEADLESSSHELL &&
        browser.buildId === buildId,
    );

    if (preferredBrowser) {
      logger.log(`Using already installed Chrome: ${preferredBrowser.buildId}`);
      return {
        folderPath: preferredBrowser.path,
        executablePath: preferredBrowser.executablePath,
        local: true,
        revision: preferredBrowser.buildId,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`Error checking installed browsers: ${errorMessage}`);
  }

  return {
    folderPath: '',
    executablePath: '',
    local: false,
    revision: buildId,
  };
};

const installPreferredBrowserRevision = async (): Promise<RevisionInfo> => {
  const logger = preLogger('installer');

  // Get browser info with a version we can download
  const browserInfo = await getPreferredBrowserRevisionInfo();

  // If we already have the specific version installed, return it
  if (browserInfo.local) {
    return browserInfo;
  }

  try {
    logger.warn(
      `Chrome version ${browserInfo.revision} is not found, going to download it for you`,
    );

    const canInstall = await canDownload({
      browser: Browser.CHROMEHEADLESSSHELL,
      buildId: browserInfo.revision,
      cacheDir: DEFAULT_CACHE_DIR,
    });

    if (!canInstall) {
      throw new Error(`Cannot download Chrome ${browserInfo.revision}`);
    }

    const installedBrowser = await install({
      browser: Browser.CHROMEHEADLESSSHELL,
      buildId: browserInfo.revision,
      cacheDir: DEFAULT_CACHE_DIR,
    });

    const revisionInfo = {
      folderPath: installedBrowser.path,
      executablePath: installedBrowser.executablePath,
      local: true,
      revision: installedBrowser.buildId,
    };

    logger.log(`Chrome downloaded to ${revisionInfo.folderPath}`);
    return revisionInfo;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to install Chrome ${browserInfo.revision}: ${errorMessage}`,
    );

    throw new Error(
      `Failed to install Chrome ${browserInfo.revision} which is required for puppeteer-core. ` +
        `Please make sure you have network connectivity and try again. Error: ${errorMessage}`,
    );
  }
};

export default {
  getPreferredBrowserRevisionInfo,
  installPreferredBrowserRevision,
};
