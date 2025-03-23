/*
Library keeps fallback data of Apple Human Interface guidelines specs on apple-fallback-data.json
This script fetches new specs with puppeteer and updates that static json file
 */

import browser from '../dist/helpers/browser.js';
import puppets from '../dist/helpers/puppets.js';
import file from '../dist/helpers/file.js';
import constants from '../dist/config/constants.js';

const { getBrowserInstance, killBrowser } = browser;
const { getSplashScreenMetaData } = puppets;
const { writeFile } = file;

(async () => {
  try {
    const { browser, chrome } = await getBrowserInstance({
      timeout: constants.BROWSER_TIMEOUT,
    });

    const splashScreenMetaData = await getSplashScreenMetaData(
      { scrape: true },
      browser,
    );
    console.log(splashScreenMetaData);
    const jsonData = JSON.stringify(splashScreenMetaData, null, 2);

    await writeFile('./src/config/apple-fallback-data.json', jsonData, {
      encoding: 'utf8',
    });
    try {
      await killBrowser(browser, chrome);
    } catch (_e) {
      // Silently try killing chrome as Chrome launcher might have already killed it
    }
  } catch (e) {
    console.error('Failed to fetch Apple specs from HIG website');
    console.error(e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
