'use strict';

const cheerio = require('cheerio');
const constants = require('../config/constants');
const file = require('../helpers/file');

const generateIconsContentForManifest = savedImages => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.MANIFEST_ICON_FILENAME_PREFIX),
    )
    .map(({ path: src, width, height }) => ({
      src,
      sizes: `${width}x${height}`,
      type: `image/${file.getExtension(src)}`,
    }));
};

const generateAppleTouchIconHtml = savedImages => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.APPLE_ICON_FILENAME_PREFIX),
    )
    .map(({ width, path }) => constants.APPLE_TOUCH_ICON_META_HTML(width, path))
    .join('');
};

const generateAppleLaunchImageHtml = savedImages => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.APPLE_SPLASH_FILENAME_PREFIX),
    )
    .map(({ width, height, path, scaleFactor }) =>
      constants.APPLE_LAUNCH_SCREEN_META_HTML(width, height, path, scaleFactor),
    )
    .join('');
};

const generateHtmlForIndexPage = savedImages => {
  return `\
${generateAppleTouchIconHtml(savedImages)}
<meta name="apple-mobile-web-app-capable" content="yes">
${generateAppleLaunchImageHtml(savedImages)}`;
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

  const warn = '<!-- AUTO GENERATED VIA PWA-ASSET-GENERATOR -->';

  const indexHtmlFile = await file.readFile(indexHtmlFilePath);
  const $ = cheerio.load(indexHtmlFile);
  $('head').append(`\
${warn}
${htmlContent}`);

  return file.writeFile(indexHtmlFilePath, $.html());
};

module.exports = {
  addIconsToManifest,
  addMetaTagsToIndexPage,
  generateHtmlForIndexPage,
  generateIconsContentForManifest,
};
