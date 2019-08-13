'use strict';

const puppeteer = require('puppeteer');
const packageJson = require('./package.json');
const constants = require('./config/constants');
const url = require('./helpers/url');
const file = require('./helpers/file');
const images = require('./helpers/images');
const preLogger = require('./helpers/logger');

const getAppleSplashScreenData = async browser => {
  const logger = preLogger(getAppleSplashScreenData.name);
  const page = await browser.newPage();
  await page.setUserAgent(constants.EMULATED_USER_AGENT);
  logger.log(
    `Navigating to Apple Human Interface Guidelines website - ${constants.APPLE_HIG_SPLASH_SCR_SPECS_URL}`,
  );

  await page.goto(constants.APPLE_HIG_SPLASH_SCR_SPECS_URL, {
    waitUntil: 'networkidle0',
  });
  logger.log('Waiting for the data table to be loaded');

  try {
    await page.waitForSelector('table', {
      timeout: constants.WAIT_FOR_SELECTOR_TIMEOUT,
    });
  } catch (e) {
    logger.error(
      `Could not find the table on the page within timeout ${constants.WAIT_FOR_SELECTOR_TIMEOUT}ms`,
    );
    throw e;
  }

  const splashScreenData = await page.evaluate(() => {
    const scrapeSplashScreenDataFromHIGPage = () =>
      Array.from(document.querySelectorAll('table tr:not(:first-child)')).map(
        tr => {
          return Array.from(tr.querySelectorAll('td')).reduce(
            (acc, curr, index) => {
              const appleLaunchScreenTableColumnOrder = [
                'device',
                'portrait',
                'landscape',
              ];
              const dimensionRegex = new RegExp(/(\d*)[^\d]+(\d*)[^\d]+/gm);

              const keyToUpdate = appleLaunchScreenTableColumnOrder[index];
              const execDimensionRegex = val => {
                return dimensionRegex.exec(val);
              };

              const getDimensions = val => {
                const regexMatch = execDimensionRegex(val);

                return {
                  width: parseInt(regexMatch[1], 10),
                  height: parseInt(regexMatch[2], 10),
                };
              };

              return {
                ...acc,
                [keyToUpdate]:
                  index > 0 ? getDimensions(curr.innerText) : curr.innerText,
              };
            },
            {
              device: '',
              portrait: { width: 0, height: 0 },
              landscape: { width: 0, height: 0 },
            },
          );
        },
      );
    return scrapeSplashScreenDataFromHIGPage();
  });

  if (splashScreenData == null) {
    const err = `Failed scraping the data on web page ${constants.APPLE_HIG_SPLASH_SCR_SPECS_URL}`;
    logger.error(err);
    throw Error(err);
  }

  logger.log('Retrieved splash screen data');
  // logger.trace(splashScreenData);
  return splashScreenData;
};

const getDeviceScaleFactorData = async browser => {
  const logger = preLogger(getDeviceScaleFactorData.name);
  const page = await browser.newPage();
  await page.setUserAgent(constants.EMULATED_USER_AGENT);
  logger.log(
    `Navigating to Apple Human Interface Guidelines website - ${constants.APPLE_HIG_DEVICE_SCALE_FACTOR_SPECS_URL}`,
  );
  await page.goto(constants.APPLE_HIG_DEVICE_SCALE_FACTOR_SPECS_URL, {
    waitUntil: 'networkidle0',
  });

  try {
    await page.waitForSelector('table', {
      timeout: constants.WAIT_FOR_SELECTOR_TIMEOUT,
    });
  } catch (e) {
    const err = `Could not find the table on the page within timeout ${constants.WAIT_FOR_SELECTOR_TIMEOUT}ms`;
    logger.error(err);
    throw Error(err);
  }

  const scaleFactorData = await page.evaluate(() => {
    const scrapeScaleFactorDataFromHIGPage = () =>
      Array.from(document.querySelectorAll('table tr:not(:first-child)')).map(
        tr => {
          return Array.from(tr.querySelectorAll('td')).reduce(
            (acc, curr, index) => {
              const appleScaleFactorTableColumnOrder = [
                'device',
                'scaleFactor',
              ];
              const scaleFactorRegex = new RegExp(/[^\d]+(\d*)[^\d]+/gm);

              const execScaleFactorRegex = val => {
                return scaleFactorRegex.exec(val);
              };

              const keyToUpdate = appleScaleFactorTableColumnOrder[index];

              const getScaleFactor = val => {
                const regexMatch = execScaleFactorRegex(val);

                return parseInt(regexMatch[1], 10);
              };

              return {
                ...acc,
                [keyToUpdate]:
                  index > 0 ? getScaleFactor(curr.innerText) : curr.innerText,
              };
            },
            { device: '', scaleFactor: 1 },
          );
        },
      );
    return scrapeScaleFactorDataFromHIGPage();
  });

  if (scaleFactorData == null) {
    const err = `Failed scraping the data on web page ${constants.APPLE_HIG_DEVICE_SCALE_FACTOR_SPECS_URL}`;
    logger.error(err);
    throw Error(err);
  }

  logger.log('Retrieved scale factor data');
  return scaleFactorData;
};

const getSplashScreenMetaData = async options => {
  const logger = preLogger(getSplashScreenMetaData.name);

  if (!options.scrape) {
    logger.log(
      `Skipped scraping - using static data from v${packageJson.version}`,
    );
    return constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA;
  }

  logger.log(
    'Initialising puppeteer to load latest splash screen metadata',
    '🤖',
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: constants.PUPPETEER_LAUNCH_ARGS,
    timeout: 1000,
  });

  let splashScreenUniformMetaData;

  try {
    const splashScreenData = await getAppleSplashScreenData(browser);
    const scaleFactorData = await getDeviceScaleFactorData(browser);
    splashScreenUniformMetaData = images.getSplashScreenScaleFactorUnionData(
      splashScreenData,
      scaleFactorData,
    );
    logger.success('Loaded splash screen metadata');
  } catch (e) {
    splashScreenUniformMetaData =
      constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA;
    logger.warn(
      `Failed to fetch latest specs from Apple Human Interface Guidelines. Using static fallback data from v${packageJson.version}`,
    );
  } finally {
    browser.close();
  }

  return splashScreenUniformMetaData;
};

const saveImages = async (images, source, output, options) => {
  const logger = preLogger(saveImages.name);
  logger.log('Initialising puppeteer to take screenshots', '🤖');

  const address = await url.getAddress(source, options);

  return images.map(async ({ name, width, height, scaleFactor }) => {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width,
        height,
      },
      args: constants.PUPPETEER_LAUNCH_ARGS,
    });

    const path = output
      ? file.getImageSavePath(name, output)
      : file.getDefaultImageSavePath(name);

    try {
      const page = await browser.newPage();
      await page.goto(address);
      await page.screenshot({
        path,
        omitBackground: !options.opaque,
        type: 'png',
      });

      logger.success(`Saved image ${name}`);
      return { name, width, height, scaleFactor, path };
    } catch (e) {
      logger.error(e.message);
      throw Error(`Failed to save image ${name}`);
    } finally {
      await browser.close();
    }
  });
};

const generateImages = async (source, output, options) => {
  const splashScreenMetaData = await getSplashScreenMetaData(options);
  const allImages = [
    ...images.getSplashScreenImages(splashScreenMetaData),
    ...images.getIconImages(),
  ];

  if (!(await file.pathExists(output, file.WRITE_ACCESS))) {
    throw Error(`Make sure output folder ${output} exists and writable`);
  }

  // Increase MaxListeners and suppress MaxListenersExceededWarning
  process.setMaxListeners(0);

  return await Promise.all(
    await saveImages(allImages, source, output, options),
  );
};

module.exports = {
  getSplashScreenMetaData,
  saveImages,
  generateImages,
};
