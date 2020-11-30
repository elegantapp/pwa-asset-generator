import uniqWith from 'lodash.uniqwith';
import isEqual from 'lodash.isequal';
import constants from '../config/constants';
import { Image, Orientation } from '../models/image';
import { LaunchScreenSpec } from '../models/spec';
import { Options } from '../models/options';

const mapToIconImageFileObj = (
  fileNamePrefix: string,
  width: number,
  height?: number,
): Image => ({
  name: `${fileNamePrefix}-${width}${height ? `-${height}` : ''}`,
  width,
  height: height ?? width,
  orientation: null,
  scaleFactor: 1,
});

const mapToImageFileObj = (
  fileNamePrefix: string,
  width: number,
  height: number,
  scaleFactor: number,
  orientation: Orientation,
): Image => ({
  name: `${fileNamePrefix}-${width}-${height}`,
  width,
  height,
  scaleFactor,
  orientation,
});

const getIconImages = (options: Options): Image[] => {
  let icons = [
    ...constants.APPLE_ICON_SIZES.map((size) =>
      mapToIconImageFileObj(constants.APPLE_ICON_FILENAME_PREFIX, size),
    ),
    ...constants.MANIFEST_ICON_SIZES.map((size) =>
      mapToIconImageFileObj(constants.MANIFEST_ICON_FILENAME_PREFIX, size),
    ),
  ];

  if (options.favicon) {
    icons = [
      ...icons,
      ...constants.FAVICON_SIZES.map((size) =>
        mapToIconImageFileObj(constants.FAVICON_FILENAME_PREFIX, size),
      ),
    ];
  }

  if (options.mstile) {
    icons = [
      ...icons,
      ...constants.MS_ICON_SIZES.map((size) => {
        if (typeof size === 'object') {
          return mapToIconImageFileObj(
            constants.MS_ICON_FILENAME_PREFIX,
            size.width,
            size.height,
          );
        }

        return mapToIconImageFileObj(constants.MS_ICON_FILENAME_PREFIX, size);
      }),
    ];
  }

  return uniqWith(icons, isEqual);
};

const getSplashScreenImages = (
  splashScreenData: LaunchScreenSpec[],
  options: Options,
): Image[] => {
  let appleSplashFilenamePrefix = constants.APPLE_SPLASH_FILENAME_PREFIX;
  if (options.darkMode) {
    appleSplashFilenamePrefix +=
      constants.APPLE_SPLASH_FILENAME_DARK_MODE_POSTFIX;
  }

  return uniqWith(
    splashScreenData.reduce((acc: Image[], curr: LaunchScreenSpec) => {
      let images: Image[] = acc;

      if (!options.landscapeOnly) {
        images = [
          ...images,
          mapToImageFileObj(
            appleSplashFilenamePrefix,
            curr.portrait.width,
            curr.portrait.height,
            curr.scaleFactor,
            'portrait',
          ),
        ];
      }
      if (!options.portraitOnly) {
        images = [
          ...images,
          mapToImageFileObj(
            appleSplashFilenamePrefix,
            curr.landscape.width,
            curr.landscape.height,
            curr.scaleFactor,
            'landscape',
          ),
        ];
      }
      return images;
    }, []),
    isEqual,
  );
};

export default {
  getIconImages,
  getSplashScreenImages,
};
