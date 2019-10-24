import cheerio from 'cheerio';
import { lookup } from 'mime-types';
import constants from '../config/constants';
import file from './file';
import { SavedImage } from '../models/image';
import { ManifestJsonIcon } from '../models/result';
import { Options } from '../models/options';
import { HTMLMeta, HTMLMetaNames, HTMLMetaSelector } from '../models/meta';

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
  darkMode: boolean,
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
        darkMode,
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
): HTMLMeta => {
  const indexHtmlPath = options.index || '';
  const pathPrefix = options.path || '';
  const prependPath = getPathPrefix(pathPrefix);
  const htmlMeta: HTMLMeta = {
    [HTMLMetaNames.appleMobileWebAppCapable]: `<meta name="apple-mobile-web-app-capable" content="yes">
`,
  };

  if (!options.splashOnly) {
    if (options.favicon) {
      htmlMeta.favicon = `${generateFaviconHtml(
        savedImages,
        indexHtmlPath,
        prependPath,
      )}`;
    }

    htmlMeta.appleTouchIcon = `${generateAppleTouchIconHtml(
      savedImages,
      indexHtmlPath,
      prependPath,
    )}`;
  }

  if (!options.iconOnly) {
    if (options.darkMode) {
      htmlMeta.appleLaunchImageDarkMode = `${generateAppleLaunchImageHtml(
        savedImages,
        indexHtmlPath,
        prependPath,
        true,
      )}`;
    } else {
      htmlMeta.appleLaunchImage = `${generateAppleLaunchImageHtml(
        savedImages,
        indexHtmlPath,
        prependPath,
        false,
      )}`;
    }
  }

  if (options.singleQuotes) {
    Object.keys(htmlMeta).forEach((metaKey: string) => {
      const metaContent = htmlMeta[metaKey as keyof HTMLMeta];
      if (metaContent) {
        metaContent.replace(/"/gm, "'");
      }
    });
    return htmlMeta;
  }

  return htmlMeta;
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

const formatMetaTags = (htmlMeta: HTMLMeta): string => {
  return constants.HTML_META_ORDERED_SELECTOR_LIST.reduce(
    (acc: string, meta: HTMLMetaSelector) => {
      if (htmlMeta.hasOwnProperty(meta.name)) {
        return `\
${acc}
${htmlMeta[meta.name]}`;
      }
      return acc;
    },
    '',
  );
};

const addMetaTagsToIndexPage = async (
  htmlMeta: HTMLMeta,
  indexHtmlFilePath: string,
): Promise<void> => {
  if (!(await file.pathExists(indexHtmlFilePath, file.WRITE_ACCESS))) {
    throw Error(`Cannot write to index html file ${indexHtmlFilePath}`);
  }

  const indexHtmlFile = await file.readFile(indexHtmlFilePath);
  const $ = cheerio.load(indexHtmlFile);

  const HEAD_SELECTOR = 'head';
  const hasElement = (selector: string): boolean => {
    return $(selector).length > 0;
  };

  const hasDarkModeElement = (): boolean => {
    const darkModeMeta = constants.HTML_META_ORDERED_SELECTOR_LIST.find(
      (m: HTMLMetaSelector) =>
        m.name === HTMLMetaNames.appleLaunchImageDarkMode,
    );
    if (darkModeMeta) {
      return $(darkModeMeta.selector).length > 0;
    }
    return false;
  };

  // TODO: Find a way to remove tags without leaving newlines behind
  constants.HTML_META_ORDERED_SELECTOR_LIST.forEach(
    (meta: HTMLMetaSelector) => {
      if (htmlMeta.hasOwnProperty(meta.name) && htmlMeta[meta.name] !== '') {
        const content = `${htmlMeta[meta.name]}`;

        if (hasElement(meta.selector)) {
          $(meta.selector).remove();
        }

        // Because meta tags with dark mode media attr has to be declared after the regular splash screen meta tags
        if (
          meta.name === HTMLMetaNames.appleLaunchImage &&
          hasDarkModeElement()
        ) {
          $(HEAD_SELECTOR).prepend(`\n${content}`);
        } else {
          $(HEAD_SELECTOR).append(`${content}\n`);
        }
      }
    },
  );

  return file.writeFile(indexHtmlFilePath, $.html());
};

export default {
  formatMetaTags,
  addIconsToManifest,
  addMetaTagsToIndexPage,
  generateHtmlForIndexPage,
  generateIconsContentForManifest,
};
