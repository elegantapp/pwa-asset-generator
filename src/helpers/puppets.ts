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

interface ScrapeDiagnostics {
  headings: string[];
  tables: { headers: string[]; firstRow: string[] }[];
}

type ScrapeResult =
  | { ok: true; data: LaunchScreenSpec[] }
  | {
      ok: false;
      reason: string;
      // Whether the client-side render has painted the article, which tells the
      // poller apart "not loaded yet" from "this page doesn't carry the data".
      rendered: boolean;
      diagnostics: ScrapeDiagnostics;
    };

const getAppleSplashScreenData = async (
  browser: Browser,
  options: Options,
): Promise<LaunchScreenSpec[]> => {
  const logger = preLogger(getAppleSplashScreenData.name, options);
  const page = await browser.newPage();
  await page.setUserAgent(constants.EMULATED_USER_AGENT);

  const tableSelector = constants.APPLE_HIG_SPLASH_SCR_SPECS_TABLE_SELECTOR;

  const scrapeDimensionsTable = (selector: string): ScrapeResult => {
    // Locate the table by progressively looser strategies, so a single id or
    // DOM change on Apple's side does not break scraping:
    //   1. the known anchor + structure (fast path)
    //   2. the heading text -> first table that follows it (survives id/nesting changes)
    //   3. the cell value shape -> any table whose cells look like device specs
    const locateTable = (): HTMLTableElement | null => {
      const direct = document.querySelector<HTMLTableElement>(selector);
      if (direct) {
        return direct;
      }

      const heading = Array.from(
        document.querySelectorAll('h1, h2, h3, h4'),
      ).find((h) =>
        /ios.*ipados.*device screen dimensions/i.test(h.textContent ?? ''),
      );
      if (heading) {
        const following = Array.from(document.querySelectorAll('table')).find(
          (t) =>
            (heading.compareDocumentPosition(t) &
              Node.DOCUMENT_POSITION_FOLLOWING) !==
            0,
        );
        if (following) {
          return following;
        }
      }

      const looksLikeDimensions =
        /\d+\s*x\s*\d+\s*pt\s*\(\s*\d+\s*x\s*\d+\s*px/i;
      return (
        Array.from(document.querySelectorAll('table')).find((t) =>
          Array.from(t.querySelectorAll('tbody td')).some((td) =>
            looksLikeDimensions.test(td.textContent ?? ''),
          ),
        ) ?? null
      );
    };

    const collectDiagnostics = (): ScrapeDiagnostics => ({
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .slice(0, 40)
        .map(
          (h) =>
            `<${h.tagName.toLowerCase()} id="${h.id}"> ${(h.textContent ?? '')
              .trim()
              .slice(0, 80)}`,
        ),
      tables: Array.from(document.querySelectorAll('table'))
        .slice(0, 20)
        .map((t) => ({
          headers: Array.from(t.querySelectorAll('thead th, thead td')).map(
            (c) => (c.textContent ?? '').trim(),
          ),
          firstRow: Array.from(t.querySelectorAll('tbody tr'))
            .slice(0, 1)
            .flatMap((tr) =>
              Array.from(tr.querySelectorAll('td')).map((td) =>
                (td.textContent ?? '').trim(),
              ),
            ),
        })),
    });

    // The SPA shell ships the site chrome (including its h2s) before the
    // article renders; the article's own <h1> and its tables only exist once
    // the render has run, so either is a reliable "this page has painted" flag.
    const fail = (reason: string): ScrapeResult => ({
      ok: false,
      reason,
      rendered:
        document.querySelectorAll('table').length > 0 ||
        document.querySelector('h1') !== null,
      diagnostics: collectDiagnostics(),
    });

    const table = locateTable();
    if (!table) {
      return fail(
        'Could not locate the iOS/iPadOS device screen dimensions table',
      );
    }

    // Tolerant of spacing, wording and multi-digit scale factors (e.g. @2x, @3x).
    const dimensionRegex =
      /(\d+)\s*x\s*(\d+)\s*pt\s*\(\s*(\d+)\s*x\s*(\d+)\s*px\s*@\s*(\d+)\s*x/i;

    const data: LaunchScreenSpec[] = [];
    Array.from(table.querySelectorAll('tbody tr')).forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll<HTMLTableCellElement>('td'));
      // Skip section/sub-header rows instead of failing on a changed column count.
      if (cells.length < 2) {
        return;
      }

      const device = cells[0].innerText.trim();
      const match = cells
        .slice(1)
        .map((cell) => cell.innerText.trim().match(dimensionRegex))
        .find((m) => m !== null);

      if (!device || !match) {
        return;
      }

      const widthInPoints = parseInt(match[1], 10);
      const heightInPoints = parseInt(match[2], 10);
      const scaleFactor = parseInt(match[5], 10);
      if (!widthInPoints || !heightInPoints || !scaleFactor) {
        return;
      }

      const width = widthInPoints * scaleFactor;
      const height = heightInPoints * scaleFactor;
      data.push({
        device,
        portrait: { width, height },
        landscape: { width: height, height: width },
        scaleFactor,
      });
    });

    if (!data.length) {
      return fail('Located the dimensions table but parsed zero device rows');
    }

    return { ok: true, data };
  };

  // Poll one source until its client-rendered dimensions table shows up. Once
  // the page reports itself as painted, a still-missing dimensions table means
  // this source simply doesn't carry the data — give the render a short settle
  // window, then let the caller move on to the next source instead of burning
  // the whole budget waiting for something that is never going to appear.
  // The budget is driven solely by the JS-level deadline and each evaluate()'s
  // protocolTimeout (see browser.ts) — BROWSER_TIMEOUT only bounds browser
  // launch/connect, so the full window is always available here.
  const pollSourceForTable = async (): Promise<ScrapeResult> => {
    const deadline = Date.now() + constants.APPLE_HIG_SCRAPE_TIMEOUT;
    let settleDeadline = Infinity;
    let result = await page.evaluate(scrapeDimensionsTable, tableSelector);
    if (!result.ok) {
      logger.log(
        `Data table not ready yet; polling for up to ${
          constants.APPLE_HIG_SCRAPE_TIMEOUT / 1000
        }s`,
      );
    }
    while (!result.ok && Date.now() < Math.min(deadline, settleDeadline)) {
      if (result.rendered && settleDeadline === Infinity) {
        settleDeadline = Date.now() + constants.APPLE_HIG_SCRAPE_SETTLE_TIMEOUT;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
      result = await page.evaluate(scrapeDimensionsTable, tableSelector);
    }
    return result;
  };

  // A located table is only usable if it actually yields the full device set —
  // a partial or unrelated table must be rejected so the next source gets a go.
  const validate = (data: LaunchScreenSpec[]): string | null => {
    const hasIphone = data.some((d) => /iphone/i.test(d.device));
    const hasIpad = data.some((d) => /ipad/i.test(d.device));
    const allDimensionsValid = data.every(
      (d) =>
        d.portrait.width > 0 &&
        d.portrait.height > 0 &&
        d.landscape.width > 0 &&
        d.landscape.height > 0 &&
        d.scaleFactor > 0,
    );

    if (
      data.length < constants.APPLE_HIG_MIN_EXPECTED_DEVICES ||
      !hasIphone ||
      !hasIpad ||
      !allDimensionsValid
    ) {
      return `Scraped data failed validation (got ${data.length} devices, iPhone: ${hasIphone}, iPad: ${hasIpad}, dimensions valid: ${allDimensionsValid})`;
    }

    return null;
  };

  const sources = constants.APPLE_HIG_SPLASH_SCR_SPECS_URLS;
  const failures: string[] = [];

  try {
    for (const source of sources) {
      logger.log(
        `Navigating to Apple Human Interface Guidelines website - ${source}`,
      );

      // The HIG pages are client-side rendered SPAs
      await page.goto(source, { waitUntil: 'domcontentloaded' });

      logger.log('Waiting for the data table to be loaded');

      const result = await pollSourceForTable();

      if (!result.ok) {
        logger.error(`${result.reason} on ${source}`);
        logger.error(
          `Apple HIG page structure may have changed. Headings seen: ${JSON.stringify(
            result.diagnostics.headings,
          )}`,
        );
        logger.error(
          `Tables seen: ${JSON.stringify(result.diagnostics.tables)}`,
        );
        failures.push(`${source}: ${result.reason}`);
        continue;
      }

      const validationError = validate(result.data);
      if (validationError) {
        logger.error(`${validationError} on ${source}`);
        failures.push(`${source}: ${validationError}`);
        continue;
      }

      logger.log(`Retrieved splash screen data from ${source}`);
      return result.data;
    }

    throw new Error(
      `Could not locate the iOS/iPadOS device screen dimensions table on any known Apple source. Tried ${
        sources.length
      } source(s) - ${failures.join(' | ')}`,
    );
  } finally {
    try {
      await page.close();
    } catch {
      // The browser may already be tearing down; closing the page is best-effort
    }
  }
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
    return constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA as LaunchScreenSpec[];
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

  const splashScreenMetaData = await getSplashScreenMetaData(options, browser);

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
  getAppleSplashScreenData,
  getSplashScreenMetaData,
  saveImages,
  generateImages,
  getOptimalConcurrency,
};
