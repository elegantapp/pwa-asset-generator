/*
Library keeps fallback data of Apple Human Interface guidelines specs on apple-fallback-data.json
This script fetches new specs with puppeteer and updates that static json file
 */

import browser from '../dist/helpers/browser.js';
import puppets from '../dist/helpers/puppets.js';
import file from '../dist/helpers/file.js';
import constants from '../dist/config/constants.js';

const { getBrowserInstance, killBrowser } = browser;
// Deliberately use getAppleSplashScreenData (not getSplashScreenMetaData) here:
// the latter swallows scrape failures and returns the existing static fallback
// data so runtime callers degrade gracefully. This script's entire purpose is
// refreshing that fallback data, so a scrape failure must throw and fail the
// run loudly instead of silently rewriting the file with data that was never
// actually re-scraped.
const { getAppleSplashScreenData } = puppets;
const { writeFile } = file;

(async () => {
  try {
    const { browser, chrome } = await getBrowserInstance({
      timeout: constants.BROWSER_TIMEOUT,
    });

    const splashScreenMetaData = await getAppleSplashScreenData(browser, {
      scrape: true,
    });
    console.log(splashScreenMetaData);
    // Trailing newline keeps the generated file Prettier-compliant
    const jsonData = `${JSON.stringify(splashScreenMetaData, null, 2)}\n`;

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
