import puppeteer, { BrowserFetcher, RevisionInfo } from 'puppeteer-core';
import ProgressBar from 'progress';
import preLogger from './logger';

let browserFetcher: BrowserFetcher;

const getBrowserFetcher = (): BrowserFetcher => {
  if (browserFetcher) {
    return browserFetcher;
  }

  browserFetcher = puppeteer.createBrowserFetcher();
  return browserFetcher;
};

const getPreferredBrowserRevisionInfo = (): RevisionInfo => {
  const revision =
    process.env.PUPPETEER_CHROMIUM_REVISION ||
    process.env.npm_config_puppeteer_chromium_revision ||
    process.env.npm_package_config_puppeteer_chromium_revision ||
    require('puppeteer-core/package.json').puppeteer.chromium_revision;

  return getBrowserFetcher().revisionInfo(revision);
};

const { revision } = getPreferredBrowserRevisionInfo();
const revisionInfo = getBrowserFetcher().revisionInfo(revision);
const logger = preLogger('installer');

const toMegabytes = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} Mb`;
};

const cleanUpOldRevisions = (revisions: string[]): Promise<void[]> => {
  const localRevisions = revisions.filter(rev => revision !== rev);
  // Remove previous chromium revisions.
  const cleanupOldVersions = localRevisions.map((rev: string) =>
    getBrowserFetcher().remove(rev),
  );
  return Promise.all([...cleanupOldVersions]);
};

let progressBar: ProgressBar;
let lastDownloadedBytes = 0;
const onProgress = (downloadedBytes: number, totalBytes: number): void => {
  if (!progressBar) {
    progressBar = new ProgressBar(
      `Downloading Chromium r${revision} - ${toMegabytes(
        totalBytes,
      )} [:bar] :percent :etas `,
      {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: totalBytes,
      },
    );
  }
  const delta = downloadedBytes - lastDownloadedBytes;
  lastDownloadedBytes = downloadedBytes;
  progressBar.tick(delta);
};

const installPreferredBrowserRevision = async (): Promise<RevisionInfo> => {
  logger.warn(
    `Chromium is not found on your system, gonna have to download r${revision} for you once`,
  );

  const installedRevision = await getBrowserFetcher().download(
    revision,
    onProgress,
  );
  logger.log(`Chromium downloaded to ${revisionInfo.folderPath}`);

  await getBrowserFetcher()
    .localRevisions()
    .then(cleanUpOldRevisions);

  return installedRevision;
};

export default {
  getBrowserFetcher,
  installPreferredBrowserRevision,
  getPreferredBrowserRevisionInfo,
};
