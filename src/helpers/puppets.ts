import { Browser } from 'puppeteer-core';
import constants from '../config/constants';
import url from './url';
import file from './file';
import images from './images';
import browserHelper from './browser';
import preLogger from './logger';
import { Options } from '../models/options';
import { LaunchScreenSpec } from '../models/spec';
import { Image, SavedImage } from '../models/image';

const getAppleSplashScreenData = async (
  browser: Browser,
  options: Options,
): Promise<LaunchScreenSpec[]> => {
  const logger = preLogger(getAppleSplashScreenData.name, options);
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
    const scrapeSplashScreenDataFromHIGPage = (): LaunchScreenSpec[] => {
      return Array.from(
        document
          .querySelectorAll(
            '#Device-screen-sizes-and-orientations + .table-wrapper > table',
          )?.[0]
          .querySelectorAll('tbody tr'),
      ).map((tr) => {
        // https://regex101.com/r/4dwvYf/4
        const dimensionRegex = /(\d+)x(\d+)\spt\s\((\d+)x(\d+)\spx\s@(\d)x\)/gm;

        const getParsedSpecs = (
          val: string,
        ): { width: number; height: number; scaleFactor: number } => {
          const regexMatch = dimensionRegex.exec(val);

          if (!regexMatch?.length) {
            throw Error('Regex match failed while scraping the specs');
          }

          const widthInPoints = parseInt(regexMatch[1], 10);
          const heightInPoints = parseInt(regexMatch[2], 10);
          const scaleFactor = parseInt(regexMatch[5], 10);

          if (
            widthInPoints === 0 ||
            Number.isNaN(widthInPoints) ||
            heightInPoints === 0 ||
            Number.isNaN(heightInPoints) ||
            scaleFactor === 0 ||
            Number.isNaN(scaleFactor)
          ) {
            throw Error('Got unexpected dimensions while scraping the specs');
          }

          return {
            width: widthInPoints * scaleFactor,
            height: heightInPoints * scaleFactor,
            scaleFactor,
          };
        };

        const tableColumns = ['device', 'portrait'];
        const columns = Array.from(tr.querySelectorAll('td'));

        if (columns.length !== tableColumns.length) {
          throw Error(
            'Table columns on the page do not match with the scraper',
          );
        }

        return columns.reduce(
          (acc, curr: HTMLElement, index) => {
            if (index === 0) {
              return {
                ...acc,
                device: curr.innerText,
              };
            }

            const specs = getParsedSpecs(curr.innerText.trim());

            return {
              ...acc,
              portrait: { width: specs.width, height: specs.height },
              landscape: { width: specs.height, height: specs.width },
              scaleFactor: specs.scaleFactor,
            };
          },
          {
            device: '',
            portrait: { width: 0, height: 0 },
            landscape: { width: 0, height: 0 },
            scaleFactor: 0,
          },
        ) as LaunchScreenSpec;
      });
    };
    return scrapeSplashScreenDataFromHIGPage();
  });

  if (!splashScreenData.length) {
    const err = `Failed scraping the data on web page ${constants.APPLE_HIG_SPLASH_SCR_SPECS_URL}`;
    logger.error(err);
    throw Error(err);
  }

  logger.log('Retrieved splash screen data');
  await page.close();
  return splashScreenData;
};

const getSplashScreenMetaData = async (
  options: Options,
  browser: Browser,
): Promise<LaunchScreenSpec[]> => {
  const logger = preLogger(getSplashScreenMetaData.name, options);

  if (!options.scrape) {
    logger.log(`Skipped scraping - using static data`);
    return constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA as LaunchScreenSpec[];
  }

  logger.log(
    'Initialising puppeteer to load latest splash screen metadata',
    '🤖',
  );

  let splashScreenMetaData;

  try {
    splashScreenMetaData = await getAppleSplashScreenData(browser, options);
    logger.success('Loaded metadata for iOS platform');
  } catch (e) {
    const error = e as Error;
    logger.error(error);
    logger.warn(
      `Failed to fetch latest specs from Apple Human Interface guidelines - using static fallback data`,
    );
    throw error;
  }

  return splashScreenMetaData;
};

const canNavigateTo = (source: string): boolean =>
  (url.isUrl(source) && !file.isImageFile(source)) || file.isHtmlFile(source);

const saveImages = async (
  imageList: Image[],
  source: string,
  output: string,
  options: Options,
  browser: Browser,
): Promise<SavedImage[]> => {
  let address: string;
  let shellHtml: string;

  const logger = preLogger(saveImages.name, options);
  logger.log('Initialising puppeteer to take screenshots', '🤖');

  if (canNavigateTo(source)) {
    address = await url.getAddress(source, options);
  } else {
    shellHtml = await url.getShellHtml(source, options);
  }

  return Promise.all(
    imageList.map(async ({ name, width, height, scaleFactor, orientation }) => {
      const { quality } = options;
      const isIcon = name.includes('icon');
      const isManifestIcon = name.includes('manifest-icon');
      const type = isIcon ? 'png' : options.type;
      const path = file.getImageSavePath(
        name,
        output,
        type,
        options.maskable,
        isManifestIcon,
      );

      try {
        const page = await browser.newPage();
        await page.emulate({
          userAgent: constants.EMULATED_USER_AGENT,
          viewport: {
            width: width / scaleFactor,
            height: height / scaleFactor,
            deviceScaleFactor: scaleFactor,
            isLandscape: orientation === 'landscape',
          },
        });

        if (address) {
          // Emulate dark mode media feature when html source is provided and darkMode is enabled
          if (options.darkMode) {
            await page.emulateMediaFeatures([
              {
                name: 'prefers-color-scheme',
                value: 'dark',
              },
            ]);
          }
          await page.goto(address, { waitUntil: 'networkidle0' });
        } else {
          await page.setContent(shellHtml);
        }

        await page.screenshot({
          path,
          omitBackground: !options.opaque,
          ...(type !== 'png' ? { quality } : {}),
        });

        await page.close();

        logger.success(`Saved image ${name}`);

        return { name, width, height, scaleFactor, path, orientation };
      } catch (e) {
        const error = e as Error;
        logger.error(error.message);
        throw Error(`Failed to save image ${name}`);
      }
    }),
  );
};

const generateImages = async (
  source: string,
  output: string,
  options: Options,
): Promise<SavedImage[]> => {
  const logger = preLogger(generateImages.name, options);
  const isHtmlInput = canNavigateTo(source);

  if (isHtmlInput) {
    logger.warn(
      'noSandbox option is disabled for HTML inputs, use an image input instead',
    );
  }

  const { browser, chrome } = await browserHelper.getBrowserInstance(
    {
      timeout: constants.BROWSER_TIMEOUT,
      args: constants.CHROME_LAUNCH_ARGS,
    },
    isHtmlInput ? false : options.noSandbox,
  );

  let splashScreenMetaData;

  try {
    splashScreenMetaData = await getSplashScreenMetaData(options, browser);
  } catch (e) {
    splashScreenMetaData = constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA;
  }

  const allImages = [
    ...(!options.iconOnly
      ? images.getSplashScreenImages(
          splashScreenMetaData as LaunchScreenSpec[],
          options,
        )
      : []),
    ...(!options.splashOnly ? images.getIconImages(options) : []),
  ];

  if (
    !(
      (await file.exists(output)) &&
      (await file.isPathAccessible(output, file.WRITE_ACCESS))
    )
  ) {
    file.makeDirRecursiveSync(output);
    logger.warn(
      `Looks like folder ${output} doesn't exist. Created one for you`,
    );
  }

  const savedImages = await saveImages(
    allImages,
    source,
    output,
    options,
    browser,
  );

  try {
    await browserHelper.killBrowser(browser, chrome);
  } catch (e) {
    // Silently try killing chrome as Chrome launcher might have already killed it
  }

  return savedImages;
};

export default {
  getSplashScreenMetaData,
  saveImages,
  generateImages,
};
