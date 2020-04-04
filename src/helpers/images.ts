import uniqWith from 'lodash.uniqwith';
import isEqual from 'lodash.isequal';
import constants from '../config/constants';
import { Image, Orientation } from '../models/image';
import {
  DeviceFactorSpec,
  LaunchScreenSpec,
  SplashScreenSpec,
} from '../models/spec';
import { Options } from '../models/options';

const mapToSqImageFileObj = (fileNamePrefix: string, size: number): Image => ({
  name: `${fileNamePrefix}-${size}`,
  width: size,
  height: size,
  orientation: null,
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
      mapToSqImageFileObj(constants.APPLE_ICON_FILENAME_PREFIX, size),
    ),
    ...constants.MANIFEST_ICON_SIZES.map((size) =>
      mapToSqImageFileObj(constants.MANIFEST_ICON_FILENAME_PREFIX, size),
    ),
  ];

  if (options.favicon) {
    icons = [
      ...icons,
      ...constants.FAVICON_SIZES.map((size) =>
        mapToSqImageFileObj(constants.FAVICON_FILENAME_PREFIX, size),
      ),
    ];
  }
  return uniqWith(icons, isEqual);
};

const getSplashScreenImages = (
  uniformSplashScreenData: SplashScreenSpec[],
  options: Options,
): Image[] => {
  let appleSplashFilenamePrefix = constants.APPLE_SPLASH_FILENAME_PREFIX;
  if (options.darkMode) {
    appleSplashFilenamePrefix +=
      constants.APPLE_SPLASH_FILENAME_DARK_MODE_POSTFIX;
  }

  return uniqWith(
    uniformSplashScreenData.reduce((acc: Image[], curr: SplashScreenSpec) => {
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

const getSplashScreenScaleFactorUnionData = (
  launchScreenSpecs: LaunchScreenSpec[],
  deviceFactorSpecs: DeviceFactorSpec[],
): SplashScreenSpec[] => {
  return launchScreenSpecs.map((launchScreenSpec: LaunchScreenSpec) => {
    const matchedDevice = deviceFactorSpecs.find(
      (deviceFactorSpec: DeviceFactorSpec) =>
        deviceFactorSpec.device === launchScreenSpec.device,
    );

    if (matchedDevice) {
      return {
        ...launchScreenSpec,
        scaleFactor: matchedDevice.scaleFactor,
      } as SplashScreenSpec;
    }

    return launchScreenSpec as SplashScreenSpec;
  });
};

export default {
  getIconImages,
  getSplashScreenImages,
  getSplashScreenScaleFactorUnionData,
};
