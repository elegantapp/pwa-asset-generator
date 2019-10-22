import cheerio from 'cheerio';
import { lookup } from 'mime-types';
import constants from '../config/constants';
import file from './file';
import { SavedImage } from '../models/image';
import { ManifestJsonIcon } from '../models/result';
import { Options } from '../models/options';

const generateIconsContentForManifest = (
  savedImages: SavedImage[],
  manifestJsonPath = '',
): ManifestJsonIcon[] => {
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
  savedImages: SavedImage[],
  indexHtmlPath: string,
  pathPrefix = '',
): string => {
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

const generateFaviconHtml = (
  savedImages: SavedImage[],
  indexHtmlPath: string,
  pathPrefix = '',
): string => {
  return savedImages
    .filter(image => image.name.startsWith(constants.FAVICON_FILENAME_PREFIX))
    .map(({ width, path }) =>
      constants.FAVICON_META_HTML(
        width,
        pathPrefix + file.getRelativeImagePath(indexHtmlPath, path),
        lookup(path) as string,
      ),
    )
    .join('');
};

const generateAppleLaunchImageHtml = (
  savedImages: SavedImage[],
  indexHtmlPath: string,
  pathPrefix = '',
): string => {
  return savedImages
    .filter(image =>
      image.name.startsWith(constants.APPLE_SPLASH_FILENAME_PREFIX),
    )
    .map(({ width, height, path, scaleFactor, orientation }) =>
      constants.APPLE_LAUNCH_SCREEN_META_HTML(
        width,
        height,
        pathPrefix + file.getRelativeImagePath(indexHtmlPath, path),
        scaleFactor as number,
        orientation,
      ),
    )
    .join('');
};

const getPathPrefix = (pathPrefix: string): string => {
  if (pathPrefix) {
    return `${pathPrefix}/`;
  }
  return '';
};

const generateHtmlForIndexPage = (
  savedImages: SavedImage[],
  options: Options,
): string => {
  const indexHtmlPath = options.index || '';
  const pathPrefix = options.path || '';
  const prependPath = getPathPrefix(pathPrefix);
  let html = '';

  if (options.favicon) {
    html += `${generateFaviconHtml(savedImages, indexHtmlPath, prependPath)}
`;
  }

  html += `\
${generateAppleTouchIconHtml(savedImages, indexHtmlPath, prependPath)}
<meta name="apple-mobile-web-app-capable" content="yes">
${generateAppleLaunchImageHtml(savedImages, indexHtmlPath, prependPath)}`;

  if (options.singleQuotes) {
    return html.replace(/"/gm, "'");
  }

  return html;
};

const addIconsToManifest = async (
  manifestContent: ManifestJsonIcon[],
  manifestJsonFilePath: string,
): Promise<void> => {
  if (!(await file.pathExists(manifestJsonFilePath, file.WRITE_ACCESS))) {
    throw Error(`Cannot write to manifest json file ${manifestJsonFilePath}`);
  }

  const manifestJson = JSON.parse((await file.readFile(
    manifestJsonFilePath,
  )) as string);

  const newManifestContent = {
    ...manifestJson,
    icons: [
      ...manifestJson.icons.filter(
        (icon: ManifestJsonIcon) =>
          !manifestContent.some(man => man.sizes === icon.sizes),
      ),
      ...manifestContent,
    ],
  };

  return file.writeFile(
    manifestJsonFilePath,
    JSON.stringify(newManifestContent, null, 2),
  );
};

const addMetaTagsToIndexPage = async (
  htmlContent: string,
  indexHtmlFilePath: string,
): Promise<void> => {
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

export default {
  addIconsToManifest,
  addMetaTagsToIndexPage,
  generateHtmlForIndexPage,
  generateIconsContentForManifest,
};
