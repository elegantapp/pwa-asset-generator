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

// Apple removed the "iOS, iPadOS device screen dimensions" table from its Human
// Interface Guidelines in September 2026 (GH-1276). The data is not published
// anywhere else on the site, so there is no live source left to scrape and the
// bundled apple-fallback-data.json - refreshed from the last successful scrape -
// is now the single source of truth for launch image specs.
//
// The `scrape` option is kept so existing CLI invocations and module callers
// keep working, but it is a deprecated no-op: this never reaches the network.
const getSplashScreenMetaData = (options: Options): LaunchScreenSpec[] => {
  const logger = preLogger(getSplashScreenMetaData.name, options);

  if (options.scrape) {
    logger.warn(
      'The scrape option is deprecated and has no effect - Apple no longer publishes the iOS/iPadOS device screen dimensions table, so the bundled static specs are always used',
    );
  }

  logger.log('Using bundled Apple device specs for splash screens');

  return constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA as LaunchScreenSpec[];
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

  // PAG_USE_NO_SANDBOX is an environment-level escape hatch for hosts where
  // Chromium cannot sandbox at all (CI containers, running as root). It is
  // resolved here, next to the HTML-input guard, so that the warning below
  // describes what actually happens rather than what the option asked for.
  const sandboxDisabledViaEnv = process.env.PAG_USE_NO_SANDBOX === '1';
  const noSandbox = isHtmlInput
    ? sandboxDisabledViaEnv
    : options.noSandbox || sandboxDisabledViaEnv;

  if (isHtmlInput) {
    logger.warn(
      sandboxDisabledViaEnv
        ? 'noSandbox option is disabled for HTML inputs, but PAG_USE_NO_SANDBOX is set in the environment so Chromium still runs without a sandbox'
        : 'noSandbox option is disabled for HTML inputs, use an image input instead',
    );
  }

  const { browser, chrome } = await browserHelper.getBrowserInstance(
    {
      timeout: constants.BROWSER_TIMEOUT,
      args: constants.CHROME_LAUNCH_ARGS,
    },
    noSandbox,
  );

  const splashScreenMetaData = getSplashScreenMetaData(options);

  const allImages = [
    ...(!options.iconOnly
      ? images.getSplashScreenImages(splashScreenMetaData, options)
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
