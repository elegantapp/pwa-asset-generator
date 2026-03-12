import os from 'node:os';
import constants from '../config/constants.js';
import url from './url.js';
import file from './file.js';
import images from './images.js';
import browserHelper from './browser.js';
import preLogger from './logger.js';
import type { Browser } from 'puppeteer-core';
import type { Options } from '../models/options.js';
import type { LaunchScreenSpec } from '../models/spec.js';
import type { Image, SavedImage } from '../models/image.js';

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
    const scrapeSplashScreenDataFromHIGPage = (): LaunchScreenSpec[] =>
      Array.from(
        document
          .querySelectorAll(
            `#iOS-iPadOS-device-screen-dimensions + .table-wrapper > table`,
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
              acc.device = curr.innerText;
              return acc;
            }

            const specs = getParsedSpecs(curr.innerText.trim());

            acc.portrait = { width: specs.width, height: specs.height };
            acc.landscape = { width: specs.height, height: specs.width };
            acc.scaleFactor = specs.scaleFactor;
            return acc;
          },
          {
            device: '',
            portrait: { width: 0, height: 0 },
            landscape: { width: 0, height: 0 },
            scaleFactor: 0,
          },
        ) as LaunchScreenSpec;
      });
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

  let splashScreenMetaData: LaunchScreenSpec[];

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

// Each Chrome renderer context uses ~150MB for rendering large splash screen images.
// This is a heuristic — actual usage varies by image size (higher for retina/4x, lower for small icons).
const MEMORY_PER_CONTEXT_BYTES = 150 * 1024 * 1024;

const getOptimalConcurrency = (imageCount: number): number => {
  const rawCpu = process.env.PAG_SIMULATE_CPU_COUNT;
  if (rawCpu !== undefined && !Number.isFinite(Number(rawCpu))) {
    throw new Error(
      `PAG_SIMULATE_CPU_COUNT must be a valid number, got: "${rawCpu}"`,
    );
  }
  const cpuCount = rawCpu !== undefined ? Number(rawCpu) : os.cpus().length;
  const rawMem = process.env.PAG_SIMULATE_FREE_MEM_MB;
  if (rawMem !== undefined && !Number.isFinite(Number(rawMem))) {
    throw new Error(
      `PAG_SIMULATE_FREE_MEM_MB must be a valid number, got: "${rawMem}"`,
    );
  }
  const freeMem =
    rawMem !== undefined ? Number(rawMem) * 1024 * 1024 : os.freemem();
  // Cap by memory: use at most 80% of currently free memory across all contexts
  const memoryBasedLimit = Math.floor(
    (freeMem * 0.8) / MEMORY_PER_CONTEXT_BYTES,
  );
  // CPU count is the primary driver; memory caps it on constrained machines
  const concurrency = Math.max(1, Math.min(cpuCount, memoryBasedLimit));
  return Math.min(concurrency, imageCount);
};

const saveImages = async (
  imageList: Image[],
  source: string,
  output: string,
  options: Options,
  browser: Browser,
): Promise<SavedImage[]> => {
  let address: string | undefined = undefined;
  let shellHtml: string | undefined = undefined;

  const logger = preLogger(saveImages.name, options);
  logger.log('Initialising puppeteer to take screenshots', '🤖');

  if (canNavigateTo(source)) {
    address = await url.getAddress(source, options);
  } else {
    shellHtml = await url.getShellHtml(source, options);
  }

  // Pre-allocated by index so each worker can write its slot without coordination.
  // All slots are guaranteed to be filled if Promise.all resolves successfully.
  const results: SavedImage[] = new Array(imageList.length);
  let nextIndex = 0;
  const concurrency = getOptimalConcurrency(imageList.length);

  const workers = Array.from({ length: concurrency }, async () => {
    const browserContext = await browser.createBrowserContext();
    const page = await browserContext.newPage();

    let currentImageName = '';
    try {
      while (nextIndex < imageList.length) {
        const i = nextIndex++;
        const { name, width, height, scaleFactor, orientation } = imageList[i];
        currentImageName = name;
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
        ) as `${string}.${'png' | 'jpeg' | 'webp'}`;

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
        } else if (shellHtml) {
          await page.setContent(shellHtml);
        }

        await page.bringToFront();
        await page.screenshot({
          path,
          omitBackground: !options.opaque,
          ...(type !== 'png' ? { quality } : {}),
        });

        logger.success(`Saved image ${name}`);
        results[i] = { name, width, height, scaleFactor, path, orientation };
      }
    } catch (e) {
      const error = e as Error;
      logger.error(
        `Failed processing image "${currentImageName}": ${error.message}`,
      );
      throw error;
    } finally {
      await page.close();
      await browserContext.close();
    }
  });

  // Note: when one worker throws, Promise.all rejects immediately, but the
  // remaining workers keep running — both finishing their current image AND
  // continuing to pull new items from the queue (nextIndex is still incrementing).
  // On a 5-worker setup with an error at image #10, workers 2–5 will process
  // images #11–N to completion before the rejection propagates to the caller.
  // Partial results written to disk are not cleaned up on failure.
  await Promise.all(workers);
  return results;
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

  let splashScreenMetaData: LaunchScreenSpec[];

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
      file.existsSync(output) &&
      (await file.isPathAccessible(output, file.WRITE_ACCESS))
    )
  ) {
    file.makeDirRecursiveSync(output);
    logger.warn(
      `Looks like folder ${output} doesn't exist. Created one for you`,
    );
  }

  let savedImages: SavedImage[] = [];

  try {
    savedImages = await saveImages(allImages, source, output, options, browser);
  } finally {
    await browserHelper.killBrowser(browser, chrome).catch(() => {
      // Silently try killing chrome as Chrome launcher might have already killed it
    });
  }

  return savedImages;
};

export default {
  getSplashScreenMetaData,
  saveImages,
  generateImages,
  getOptimalConcurrency,
};
