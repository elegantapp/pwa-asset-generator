import path from 'path';
import { generateImages } from './main';
import file from './helpers/file';
import constants from './config/constants';
import { ManifestJsonIcon, Result } from './models/result';
import { CLIOptions } from './models/options';
import { HTMLMetaNames } from './models/meta';
import { SavedImage } from './models/image';

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

    test('dark mode splash screen html', async () => {
      const result = await generateTempImages({
        scrape: false,
        splashOnly: true,
        type: 'jpeg',
        quality: 80,
        darkMode: true,
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

    const saveManifest = (manifestMock: object): Promise<void> => {
      return file.writeFile(
        './temp/manifest.json',
        JSON.stringify(manifestMock),
      );
    };

    const readManifest = (): Promise<{ icons: ManifestJsonIcon[] }> =>
      file
        .readFile('./temp/manifest.json')
        .then(resp => JSON.parse(resp as string));

    test('creating icons array', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { icons, ...manifestJsonMock } = MANIFEST_JSON_MOCK;
      await saveManifest(manifestJsonMock);
      await saveImagesToManifest();

      const manifestJson = await readManifest();

      expect(manifestJson.icons).toBeDefined();
      expect(manifestJson.icons.length).toBe(2);
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
      expect(manifestJson.icons.length).toBe(4);
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
      expect(manifestJson.icons.length).toBe(2);
    });
  });

  describe('saving meta to index.html', () => {
    const saveIndex = (): Promise<void> => {
      return file.writeFile(
        './temp/index.html',
        constants.SHELL_HTML_FOR_LOGO('test.png', 'white', '10px'),
      );
    };

    const readIndex = (): Promise<Buffer | string> =>
      file.readFile('./temp/index.html', { encoding: 'utf8' });

    beforeEach(async () => {
      await saveIndex();
    });

    test('creating a favicon meta', async () => {
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

    test('creating apple icons meta', async () => {
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

    test('creating splash screens meta', async () => {
      const result = await generateTempImages({
        scrape: false,
        splashOnly: true,
        log: false,
        index: './temp/index.html',
      });

      const savedIndex = await readIndex();

      expect(savedIndex).toContain(
        result.htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
      );
      expect(savedIndex).toContain(
        result.htmlMeta[HTMLMetaNames.appleLaunchImage],
      );
    });

    test('creating splash screens meta with dark mode enabled', async () => {
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

      const savedIndex = await readIndex();

      expect(savedIndex).toContain(
        resultDark.htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
      );
      expect(savedIndex).toContain(
        resultLight.htmlMeta[HTMLMetaNames.appleLaunchImage],
      );
      expect(savedIndex).toContain(
        resultDark.htmlMeta[HTMLMetaNames.appleLaunchImageDarkMode],
      );
    });
  });
});

describe('visually compares generated images with', () => {
  const pixelmatch = require('pixelmatch');
  const { PNG } = require('pngjs');
  const JPEG = require('jpeg-js');

  const doFilesLookSame = (fileAPath: string, fileBPath: string): boolean => {
    const isPNG = fileAPath.endsWith('.png');
    let imgA;
    let imgB;

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
        threshold: 0.1,
      },
    );

    return numDiffPixels === 0;
  };

  const assertMatchedSnapshots = async (
    result: Result,
    testSuite: string,
  ): Promise<void> => {
    const SNAPSHOT_PATH = './src/__snapshots__/visual';
    const snapshots = await file.getFilesInDir(
      path.join(SNAPSHOT_PATH, testSuite),
    );

    result.savedImages.forEach((savedImage: SavedImage) => {
      const matchedSnapshot = snapshots.find(snapshot =>
        snapshot.includes(savedImage.name),
      );

      expect(
        doFilesLookSame(
          savedImage.path,
          path.join(SNAPSHOT_PATH, testSuite, matchedSnapshot as string),
        ),
      ).toBeTruthy();
    });
  };

  describe('using a local input', () => {
    test('in png format', async () => {
      const testSuite = 'input-png';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
        },
        './static/logo.png',
        `./temp/local/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
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

      await assertMatchedSnapshots(result, testSuite);
    });

    test('in html format', async () => {
      const testSuite = 'input-html';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
        },
        './static/logo.html',
        `./temp/local/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
    });

    test('with a transparency', async () => {
      const testSuite = 'output-transparent';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'transparent',
          opaque: false,
        },
        './static/logo.svg',
        `./temp/local/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
    });

    test('with JPG format as output', async () => {
      const testSuite = 'output-jpeg';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
          type: 'jpeg',
          quality: 80,
        },
        './static/logo.svg',
        `./temp/local/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
    });
  });

  describe('using a remote input', () => {
    test('in png format', async () => {
      const testSuite = 'input-png';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
        },
        'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png',
        `./temp/remote/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
    });

    test.skip('in svg format', async () => {
      const testSuite = 'input-svg';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
          background: 'coral',
        },
        'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.svg',
        `./temp/remote/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
    });

    test.skip('in html format', async () => {
      const testSuite = 'input-html';
      const result = await generateTempImages(
        {
          scrape: false,
          log: false,
        },
        'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.html',
        `./temp/remote/${testSuite}`,
      );

      await assertMatchedSnapshots(result, testSuite);
    });
  });
});
