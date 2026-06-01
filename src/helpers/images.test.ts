import { describe, test, expect } from 'vitest';
import images from './images.js';
import constants from '../config/constants.js';
import type { Options } from '../models/options.js';
import type { LaunchScreenSpec } from '../models/spec.js';
import type { Image } from '../models/image.js';

// getSplashScreenImages only reads these three flags off options.
const optionsWith = (overrides: Partial<Options> = {}): Options =>
  ({
    darkMode: false,
    landscapeOnly: false,
    portraitOnly: false,
    ...overrides,
  }) as Options;

const identity = (image: Image): string =>
  [
    image.name,
    image.width,
    image.height,
    image.scaleFactor,
    image.orientation,
  ].join('|');

// iPhone 17, iPhone 17 Pro and iPhone 16 Pro all genuinely ship at 1206x2622 @3x.
const sharedResolutionSpecs: LaunchScreenSpec[] = [
  {
    device: 'iPhone 17 Pro',
    portrait: { width: 1206, height: 2622 },
    landscape: { width: 2622, height: 1206 },
    scaleFactor: 3,
  },
  {
    device: 'iPhone 17',
    portrait: { width: 1206, height: 2622 },
    landscape: { width: 2622, height: 1206 },
    scaleFactor: 3,
  },
  {
    device: 'iPhone 16 Pro',
    portrait: { width: 1206, height: 2622 },
    landscape: { width: 2622, height: 1206 },
    scaleFactor: 3,
  },
];

describe('getSplashScreenImages', () => {
  test('consolidates devices that share a resolution into one image per orientation', () => {
    // 3 devices x 2 orientations = 6 raw images, consolidated down to 2 files.
    const result = images.getSplashScreenImages(
      sharedResolutionSpecs,
      optionsWith(),
    );

    expect(result.map((i) => i.name).sort()).toEqual([
      'apple-splash-1206-2622',
      'apple-splash-2622-1206',
    ]);
    expect(result.filter((i) => i.orientation === 'portrait')).toHaveLength(1);
    expect(result.filter((i) => i.orientation === 'landscape')).toHaveLength(1);
  });

  test('keeps a distinct image for every unique resolution (no coverage lost)', () => {
    const specs: LaunchScreenSpec[] = [
      ...sharedResolutionSpecs,
      {
        device: 'iPhone 17 Pro Max',
        portrait: { width: 1320, height: 2868 },
        landscape: { width: 2868, height: 1320 },
        scaleFactor: 3,
      },
    ];

    const result = images.getSplashScreenImages(specs, optionsWith());

    expect(result.map((i) => i.name).sort()).toEqual([
      'apple-splash-1206-2622',
      'apple-splash-1320-2868',
      'apple-splash-2622-1206',
      'apple-splash-2868-1320',
    ]);
  });

  test('respects portraitOnly / landscapeOnly while still consolidating', () => {
    const portrait = images.getSplashScreenImages(
      sharedResolutionSpecs,
      optionsWith({ portraitOnly: true }),
    );
    expect(portrait).toHaveLength(1);
    expect(portrait[0]).toMatchObject({
      name: 'apple-splash-1206-2622',
      orientation: 'portrait',
    });

    const landscape = images.getSplashScreenImages(
      sharedResolutionSpecs,
      optionsWith({ landscapeOnly: true }),
    );
    expect(landscape).toHaveLength(1);
    expect(landscape[0]).toMatchObject({
      name: 'apple-splash-2622-1206',
      orientation: 'landscape',
    });
  });

  test('produces no duplicate images from the bundled Apple fallback data', () => {
    const fallback =
      constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA as LaunchScreenSpec[];

    const result = images.getSplashScreenImages(fallback, optionsWith());

    // Every produced image is unique...
    const ids = result.map(identity);
    expect(new Set(ids).size).toBe(ids.length);

    // ...and the count matches the unique (resolution + scaleFactor + orientation)
    // images derived independently from the spec list, proving the 57 fallback
    // devices consolidate down without dropping or duplicating any resolution.
    const expected = new Set<string>();
    fallback.forEach((d) => {
      expected.add(
        `apple-splash-${d.portrait.width}-${d.portrait.height}|${d.scaleFactor}|portrait`,
      );
      expected.add(
        `apple-splash-${d.landscape.width}-${d.landscape.height}|${d.scaleFactor}|landscape`,
      );
    });
    expect(result).toHaveLength(expected.size);
  });
});
