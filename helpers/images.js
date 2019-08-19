const uniqWith = require('lodash.uniqwith');
const isEqual = require('lodash.isequal');
const constants = require('../config/constants');

const mapToSqImageFileObj = (fileNamePrefix, size) => ({
  name: `${fileNamePrefix}-${size}`,
  width: size,
  height: size,
  scaleFactor: null,
  orientation: null,
});

const mapToImageFileObj = (
  fileNamePrefix,
  width,
  height,
  scaleFactor,
  orientation,
) => ({
  name: `${fileNamePrefix}-${width}-${height}`,
  width,
  height,
  scaleFactor,
  orientation,
});

const getIconImages = () => {
  return uniqWith(
    [
      ...constants.APPLE_ICON_SIZES.map(size =>
        mapToSqImageFileObj(constants.APPLE_ICON_FILENAME_PREFIX, size),
      ),
      ...constants.MANIFEST_ICON_SIZES.map(size =>
        mapToSqImageFileObj(constants.MANIFEST_ICON_FILENAME_PREFIX, size),
      ),
    ],
    isEqual,
  );
};

const getSplashScreenImages = (uniformSplashScreenData, options) => {
  return uniqWith(
    uniformSplashScreenData
      .reduce((acc, curr) => {
        return acc.concat([
          !options.landscapeOnly
            ? mapToImageFileObj(
                constants.APPLE_SPLASH_FILENAME_PREFIX,
                curr.portrait.width,
                curr.portrait.height,
                curr.scaleFactor,
                'portrait',
              )
            : null,
          !options.portraitOnly
            ? mapToImageFileObj(
                constants.APPLE_SPLASH_FILENAME_PREFIX,
                curr.landscape.width,
                curr.landscape.height,
                curr.scaleFactor,
                'landscape',
              )
            : null,
        ]);
      }, [])
      .filter(el => el !== null),
    isEqual,
  );
};

const getSplashScreenScaleFactorUnionData = (
  splashScreenData,
  deviceScaleFactorData,
) => {
  return splashScreenData.map(ss => ({
    ...ss,
    scaleFactor: deviceScaleFactorData.find(dsf => dsf.device === ss.device)
      .scaleFactor,
  }));
};

module.exports = {
  getIconImages,
  getSplashScreenImages,
  getSplashScreenScaleFactorUnionData,
};
