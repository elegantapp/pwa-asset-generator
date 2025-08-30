import path from 'node:path';
import { generateImages } from './main.js';
import file from './helpers/file.js';
import constants from './config/constants.js';
import { HTMLMetaNames } from './models/meta.js';
import { describe, test, expect, beforeEach } from 'vitest';
import type { ManifestJsonIcon, Result } from './models/result.js';
import type { CLIOptions } from './models/options.js';
import type { SavedImage } from './models/image.js';
import type { PNGWithMetadata } from 'pngjs';
import type { BufferRet } from 'jpeg-js';

const generateTempImages = (
  options: CLIOptions,
  source = './static/logo.png',
  output = './temp',
): Promise<Result> => {
  return generateImages(source, output, options);
};

describe('generates images with', () => {
  test('icons only', async () => {
    const result = await generateTempImages({
      scrape: false,
      iconOnly: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  });

  test('splash screens only', async () => {
    const result = await generateTempImages({
      scrape: false,
      splashOnly: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  });

  test('portrait splash screens only', async () => {
    const result = await generateTempImages({
      scrape: false,
      splashOnly: true,
      portraitOnly: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  });

  test('landscape splash screens only', async () => {
    const result = await generateTempImages({
      scrape: false,
      splashOnly: true,
      landscapeOnly: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  });

  test('icons and splash screens when both only flags exist', async () => {
    const result = await generateTempImages({
      scrape: false,
      iconOnly: true,
      splashOnly: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  });
});

describe('generates meta', () => {
  describe('resulting an output with', () => {
    test('path prefix', async () => {
      const result = await generateTempImages({
        scrape: false,
        path: '%PUBLIC_URL%',
        log: false,
      });

      expect(result).toMatchSnapshot();
    });

    test('favicon html', async () => {
      const result = await generateTempImages({
        scrape: false,
        iconOnly: true,
        favicon: true,
        log: false,
      });

      expect(result).toMatchSnapshot();
    });

    test('mstile static tile image html', async () => {
      const result = await generateTempImages({
        scrape: false,
        iconOnly: true,
        mstile: true,
        log: false,
      });

      expect(result).toMatchSnapshot();
    });

    test('dark mode splash screen html', async () => {
      const result = await generateTempImages({
        scrape: false,
        splashOnly: true,
        type: 'jpg',
        quality: 80,
        darkMode: true,
        log: false,
      });

      expect(result).toMatchSnapshot();
    });

    test('jpg extension', async () => {
      const result = await generateTempImages({
        scrape: false,
        favicon: true,
        type: 'jpg',
        log: false,
      });

      expect(result).toMatchSnapshot();
    });
  });

  describe('saving meta to manifest.json', () => {
    const ICONS_MOCK = [
      {
        src: 'assets/pwa/manifest-icon-64.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: 'assets/pwa/manifest-icon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ];

    const MANIFEST_JSON_MOCK = {
      name: 'Mock App',
      display: 'standalone',
      scope: '/',
      description: 'Mock for testing',
      icons: ICONS_MOCK,
    };

    const saveImagesToManifest = (): Promise<Result> =>
      generateTempImages({
        scrape: false,
        iconOnly: true,
        log: false,
        manifest: './temp/manifest.json',
      });

    const saveManifest = (manifestMock: {
      name: string;
      display: string;
      scope: string;
      description: string;
      icons?: { src: string; sizes: string; type: string }[];
    }): Promise<void> => {
      return file.writeFile(
        './temp/manifest.json',
        JSON.stringify(manifestMock),
      );
    };

    const readManifest = (): Promise<{ icons: ManifestJsonIcon[] }> =>
      file
        .readFile('./temp/manifest.json')
        .then((resp) => JSON.parse(resp as unknown as string));

    test('creating icons array', async () => {
      const { icons, ...manifestJsonMock } = MANIFEST_JSON_MOCK;
      await saveManifest(manifestJsonMock);
      await saveImagesToManifest();

      const manifestJson = await readManifest();

      expect(manifestJson.icons).toBeDefined();
      expect(manifestJson.icons.length).toBe(4);
    });

    test('extending icons array', async () => {
      await saveManifest(MANIFEST_JSON_MOCK);
      await saveImagesToManifest();

      const manifestJson = await readManifest();

      ICONS_MOCK.forEach((icon: ManifestJsonIcon) => {
        expect(
          manifestJson.icons.find(
            (ic: ManifestJsonIcon) => ic.src === icon.src,
          ),
        ).toBeDefined();
      });
      expect(manifestJson.icons.length).toBe(6);
    });

    test('replacing items with target size in icons array', async () => {
      const ICONS_TO_BE_REPLACED_MOCK = [
        {
          src: 'assets/pwa/manifest-icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'assets/pwa/manifest-icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ];
      await saveManifest({
        ...MANIFEST_JSON_MOCK,
        icons: ICONS_TO_BE_REPLACED_MOCK,
      });
      await saveImagesToManifest();

      const manifestJson = await readManifest();

      ICONS_TO_BE_REPLACED_MOCK.forEach((icon: ManifestJsonIcon) => {
        expect(
          manifestJson.icons.find(
            (ic: ManifestJsonIcon) => ic.src === icon.src,
          ),
        ).toBeUndefined();
      });
      expect(manifestJson.icons.length).toBe(4);
    });

    test('using a path override', async () => {
      const pathOverride = './my-custom-path-override';
      const result = await generateTempImages({
        scrape: false,
        iconOnly: true,
        log: false,
        pathOverride,
        manifest: './temp/manifest.json',
      });

      expect(result).toMatchSnapshot();
    });

    test('disabling maskable icons', async () => {
      const result = await generateTempImages({
        scrape: false,
        iconOnly: true,
        log: false,
        maskable: false,
        manifest: './temp/manifest.json',
      });

      expect(result).toMatchSnapshot();
    });
  });

  describe('saving meta to index.html', () => {
    const saveIndex = (): Promise<void> => {
      return file.writeFile(
        './temp/index.html',
        constants.SHELL_HTML_FOR_LOGO('test.png', '10px', 'white'),
      );
    };

    const readIndex = (): Promise<Buffer | string> =>
      file.readFile('./temp/index.html', { encoding: 'utf8' });

    beforeEach(async () => {
      await saveIndex();
    });

    describe('creating a favicon meta', () => {
      test('with html output', async () => {
        const result = await generateTempImages({
          scrape: false,
          favicon: true,
          iconOnly: true,
          log: false,
          index: './temp/index.html',
        });

        const savedIndex = await readIndex();

        expect(savedIndex).toContain(
          result.htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
        );
        expect(savedIndex).toContain(result.htmlMeta[HTMLMetaNames.favicon]);
      });

      test('with xhtml output', async () => {
        const result = await generateTempImages({
          scrape: false,
          favicon: true,
          iconOnly: true,
          log: false,
          xhtml: true,
        });

        expect(result).toMatchSnapshot();
      });
    });

    describe('creating apple icons meta', () => {
      test('with html output', async () => {
        const result = await generateTempImages({
          scrape: false,
          iconOnly: true,
          log: false,
          index: './temp/index.html',
        });

        const savedIndex = await readIndex();

        expect(savedIndex).toContain(
          result.htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
        );
        expect(savedIndex).toContain(
          result.htmlMeta[HTMLMetaNames.appleTouchIcon],
        );
      });

      test('with xhtml output', async () => {
        const result = await generateTempImages({
          scrape: false,
          iconOnly: true,
          log: false,
          xhtml: true,
        });

        expect(result).toMatchSnapshot();
      });
    });

    describe('creating splash screens meta', () => {
      const assertEntriesInHTMLOutput = (
        output: string,
        expectedOutput: string,
      ) =>
        expectedOutput
          .split('\n')
          .forEach((entry) => expect(output).toContain(entry.trim()));

      test('with default html output', async () => {
        const result = await generateTempImages({
          scrape: false,
          splashOnly: true,
          log: false,
          index: './temp/index.html',
        });

        const savedIndex = (await readIndex()) as string;

        assertEntriesInHTMLOutput(
          savedIndex,
          result.htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
        );

        assertEntriesInHTMLOutput(
          savedIndex,
          result.htmlMeta[HTMLMetaNames.appleLaunchImage] as string,
        );
      });

      test('with dark mode html output', async () => {
        const resultLight = await generateTempImages({
          scrape: false,
          splashOnly: true,
          log: false,
          index: './temp/index.html',
        });

        const resultDark = await generateTempImages({
          scrape: false,
          splashOnly: true,
          darkMode: true,
          log: false,
          index: './temp/index.html',
        });

        const savedIndex = (await readIndex()) as string;

        assertEntriesInHTMLOutput(
          savedIndex,
          resultLight.htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
        );

        assertEntriesInHTMLOutput(
          savedIndex,
          resultLight.htmlMeta[HTMLMetaNames.appleLaunchImage] as string,
        );

        assertEntriesInHTMLOutput(
          savedIndex,
          resultDark.htmlMeta[HTMLMetaNames.appleLaunchImageDarkMode] as string,
        );
      });

      test('with xhtml output', async () => {
        const result = await generateTempImages({
          scrape: false,
          splashOnly: true,
          log: false,
          xhtml: true,
        });

        expect(result).toMatchSnapshot();
      });
    });

    test('using a path override', async () => {
      const pathOverride = './my-custom-path-override';
      const result = await generateTempImages({
        scrape: false,
        favicon: true,
        pathOverride,
        log: false,
        index: './temp/index.html',
      });

      const savedIndex = await readIndex();

      expect(savedIndex).toContain(pathOverride);
      expect(result).toMatchSnapshot();
    });
  });
});

describe('visually compares generated images with', async () => {
  const pixelmatch = await import('pixelmatch').then((m) => m.default);
  const { PNG } = await import('pngjs');
  const JPEG = await import('jpeg-js').then((m) => m.default);

  interface VisualDiffResult {
    numDiffPixels: number;
    diff: unknown;
    width: number;
    height: number;
  }

  interface MatchResult {
    path: string;
    looksSame: boolean;
  }

  const getVisualDiff = (
    fileAPath: string,
    fileBPath: string,
  ): VisualDiffResult => {
    const isPNG = fileAPath.endsWith('.png');
    let imgA: PNGWithMetadata | BufferRet;
    let imgB: PNGWithMetadata | BufferRet;

    if (isPNG) {
      imgA = PNG.sync.read(file.readFileSync(fileAPath));
      imgB = PNG.sync.read(file.readFileSync(fileBPath));
    } else {
      imgA = JPEG.decode(file.readFileSync(fileAPath));
      imgB = JPEG.decode(file.readFileSync(fileBPath));
    }
    const { width, height } = imgA;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      imgA.data,
      imgB.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.7,
      },
    );

    return {
      numDiffPixels,
      diff,
      width,
      height,
    };
  };

  const saveVisualDiff = (
    filePath: string,
    diffFileBuffer: Buffer,
    testSuite: string,
  ) => {
    const savedFileParsedPath = path.parse(filePath);

    file.makeDirRecursiveSync(`./temp/diff/${testSuite}`);
    file.writeFileSync(
      `./temp/diff/${testSuite}/diff-${savedFileParsedPath.name}.png`,
      diffFileBuffer,
    );
    file.copyFileSync(
      filePath,
      `./temp/diff/${testSuite}/${savedFileParsedPath.base}`,
    );
  };

  const doFilesLookSimilar = (
    fileAPath: string,
    fileBPath: string,
    testSuite: string,
  ): boolean => {
    const visualDiff = getVisualDiff(fileAPath, fileBPath);
    const acceptablePixedDiff = 0.25 * visualDiff.width * visualDiff.height;

    if (visualDiff.numDiffPixels >= acceptablePixedDiff) {
      console.log(`There's a diff between file ${fileAPath} and ${fileBPath}`);
      console.log(`numDiffPixels: ${visualDiff.numDiffPixels}`);

      if (visualDiff.diff instanceof PNG) {
        saveVisualDiff(
          fileAPath,
          PNG.sync.write(visualDiff.diff, { colorType: 6 }),
          testSuite,
        );
      }
    }

    return visualDiff.numDiffPixels < acceptablePixedDiff;
  };

  const getAllSnapshotsMatchStatus = async (
    result: Result,
    testSuite: string,
  ): Promise<MatchResult[]> => {
    const SNAPSHOT_PATH = './src/__snapshots__/visual';
    const snapshots = await file.getFilesInDir(
      path.join(SNAPSHOT_PATH, testSuite),
    );

    return result.savedImages.map((savedImage: SavedImage) => {
      const matchedSnapshot = snapshots.find(
        (snapshot: string) =>
          path.parse(snapshot).name === path.parse(savedImage.path).name,
      );

      let looksSame = true;

      try {
        looksSame = doFilesLookSimilar(
          savedImage.path,
          path.join(SNAPSHOT_PATH, testSuite, matchedSnapshot as string),
          testSuite,
        );
      } catch (error) {
        console.log(
          'looksSame check failed on',
          savedImage.path,
          SNAPSHOT_PATH,
          testSuite,
          matchedSnapshot as string,
          testSuite,
        );
        throw error;
      }

      if (!looksSame) {
        console.log('looksSame failed on', savedImage.path);
      }

      return {
        path: savedImage.path,
        looksSame,
      };
    });
  };

  describe('using a local input', () => {
    test('in png format', async () => {
      const testSuite = 'input-png';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          mstile: true,
          background: 'coral',
        },
        './static/logo.png',
        `./temp/local/${testSuite}`,
      );

      const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
      matchResult.forEach((mr: MatchResult) => {
        expect(mr.looksSame).toBeTruthy();
      });
    });

    test('in svg format', async () => {
      const testSuite = 'input-svg';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
        },
        './static/logo.svg',
        `./temp/local/${testSuite}`,
      );

      const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
      matchResult.forEach((mr: MatchResult) => {
        expect(mr.looksSame).toBeTruthy();
      });
    });

    describe('in html format', () => {
      test('with dark mode disabled', async () => {
        const testSuite = 'input-html';
        const result = await generateTempImages(
          {
            scrape: false,
            log: false,
          },
          './static/logo.html',
          `./temp/local/${testSuite}`,
        );

        const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
        matchResult.forEach((mr: MatchResult) => {
          expect(mr.looksSame).toBeTruthy();
        });
      });

      test('with dark mode enabled', async () => {
        const testSuite = 'input-html-dark';
        const result = await generateTempImages(
          {
            scrape: false,
            darkMode: true,
            log: false,
          },
          './static/logo.html',
          `./temp/local/${testSuite}`,
        );

        const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
        matchResult.forEach((mr: MatchResult) => {
          expect(mr.looksSame).toBeTruthy();
        });
      });
    });

    test('with a transparency', async () => {
      const testSuite = 'output-transparent';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          type: 'png',
          background: 'transparent',
          opaque: false,
        },
        './static/logo.svg',
        `./temp/local/${testSuite}`,
      );

      const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
      matchResult.forEach((mr: MatchResult) => {
        expect(mr.looksSame).toBeTruthy();
      });
    });
  });

  // Somehow flaky tests, occasionally failing on windows-latest
  // TODO: inspect the root cause of the failure
  describe.skip('using a remote input', () => {
    test('in png format', async () => {
      const testSuite = 'input-png';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
        },
        'https://onderceylan.github.io/pwa-asset-generator/static/logo.png',
        `./temp/remote/${testSuite}`,
      );

      const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
      matchResult.forEach((mr: MatchResult) => {
        expect(mr.looksSame).toBeTruthy();
      });
    });

    test('in svg format', async () => {
      const testSuite = 'input-svg';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
        },
        'https://onderceylan.github.io/pwa-asset-generator/static/logo.svg',
        `./temp/remote/${testSuite}`,
      );

      const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
      matchResult.forEach((mr: MatchResult) => {
        expect(mr.looksSame).toBeTruthy();
      });
    });

    describe('in html format', () => {
      test('with dark mode disabled', async () => {
        const testSuite = 'input-html';
        const result = await generateTempImages(
          {
            scrape: false,
            log: false,
          },
          'https://onderceylan.github.io/pwa-asset-generator/static/logo.html',
          `./temp/remote/${testSuite}`,
        );

        const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
        matchResult.forEach((mr: MatchResult) => {
          expect(mr.looksSame).toBeTruthy();
        });
      });

      test('with dark mode enabled', async () => {
        const testSuite = 'input-html-dark';
        const result = await generateTempImages(
          {
            scrape: false,
            log: false,
            darkMode: true,
          },
          'https://onderceylan.github.io/pwa-asset-generator/static/logo.html',
          `./temp/remote/${testSuite}`,
        );

        const matchResult = await getAllSnapshotsMatchStatus(result, testSuite);
        matchResult.forEach((mr: MatchResult) => {
          expect(mr.looksSame).toBeTruthy();
        });
      });
    });
  });
});
