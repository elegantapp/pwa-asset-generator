const cheerio = require('cheerio');
const constants = require('../config/constants');
const file = require('../helpers/file');

const generateIconsContentForManifest = (savedImages, manifestJsonPath) => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.MANIFEST_ICON_FILENAME_PREFIX),
    )
    .map(({ path, width, height }) => ({
      src: file.getRelativeImagePath(manifestJsonPath, path),
      sizes: `${width}x${height}`,
      type: `image/${file.getExtension(path)}`,
    }));
};

const generateAppleTouchIconHtml = (
  savedImages,
  indexHtmlPath,
  pathPrefix = '',
) => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.APPLE_ICON_FILENAME_PREFIX),
    )
    .map(({ width, path }) =>
      constants.APPLE_TOUCH_ICON_META_HTML(
        width,
        pathPrefix + file.getRelativeImagePath(indexHtmlPath, path),
      ),
    )
    .join('');
};

const generateAppleLaunchImageHtml = (
  savedImages,
  indexHtmlPath,
  pathPrefix = '',
) => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.APPLE_SPLASH_FILENAME_PREFIX),
    )
    .map(({ width, height, path, scaleFactor, orientation }) =>
      constants.APPLE_LAUNCH_SCREEN_META_HTML(
        width,
        height,
        pathPrefix + file.getRelativeImagePath(indexHtmlPath, path),
        scaleFactor,
        orientation,
      ),
    )
    .join('');
};

const getPathPrefix = pathPrefix => {
  if (pathPrefix) {
    return `${pathPrefix}/`;
  }
  return '';
};

const generateHtmlForIndexPage = (savedImages, indexHtmlPath, pathPrefix) => {
  const prependPath = getPathPrefix(pathPrefix);
  return `\
${generateAppleTouchIconHtml(savedImages, indexHtmlPath, prependPath)}
<meta name="apple-mobile-web-app-capable" content="yes">
${generateAppleLaunchImageHtml(savedImages, indexHtmlPath, prependPath)}`;
};

const addIconsToManifest = async (manifestContent, manifestJsonFilePath) => {
  if (!(await file.pathExists(manifestJsonFilePath, file.WRITE_ACCESS))) {
    throw Error(`Cannot write to manifest json file ${manifestJsonFilePath}`);
  }

  const manifestJson = JSON.parse(await file.readFile(manifestJsonFilePath));
  const newManifestContent = {
    ...manifestJson,
    icons: [
      ...manifestJson.icons.filter(
        icon => !manifestContent.some(man => man.sizes === icon.sizes),
      ),
      ...manifestContent,
    ],
  };
  return file.writeFile(
    manifestJsonFilePath,
    JSON.stringify(newManifestContent, null, 2),
  );
};

const addMetaTagsToIndexPage = async (htmlContent, indexHtmlFilePath) => {
  if (!(await file.pathExists(indexHtmlFilePath, file.WRITE_ACCESS))) {
    throw Error(`Cannot write to index html file ${indexHtmlFilePath}`);
  }

  const indexHtmlFile = await file.readFile(indexHtmlFilePath);
  const $ = cheerio.load(indexHtmlFile);

  // TODO: Find a way to remove tags without leaving newlines behind
  $(
    'link[rel="apple-touch-startup-image"], link[rel="apple-touch-icon"], meta[name="apple-mobile-web-app-capable"]',
  ).remove();

  $('head').append(`${htmlContent}`);

  return file.writeFile(indexHtmlFilePath, $.html());
};

module.exports = {
  addIconsToManifest,
  addMetaTagsToIndexPage,
  generateHtmlForIndexPage,
  generateIconsContentForManifest,
};
