import { parse, parseFragment } from 'parse5';
import { adapter as htmlparser2TreeAdapter } from 'parse5-htmlparser2-tree-adapter';
import { parseDocument } from 'htmlparser2';
import { selectOne, selectAll } from 'css-select';
import { removeElement, appendChild, prependChild } from 'domutils';
import render from 'dom-serializer';
import type { AnyNode, ChildNode, Document, Element } from 'domhandler';
import { lookup } from 'mime-types';
import path from 'node:path';
import constants from '../config/constants.js';
import file from './file.js';
import htmlFormat from './html-format.js';
import { HTMLMetaNames } from '../models/meta.js';
import type { SavedImage } from '../models/image.js';
import type { ManifestJsonIcon } from '../models/result.js';
import type { Options } from '../models/options.js';
import type { HTMLMeta, HTMLMetaSelector } from '../models/meta.js';

const generateOutputPath = (
  options: Options,
  imagePath: string,
  isManifest = false,
): string => {
  const {
    path: pathPrefix,
    pathOverride,
    index: indexHtmlPath,
    manifest: manifestJsonPath,
  } = options;

  const outputFilePath = (
    isManifest ? manifestJsonPath : indexHtmlPath
  ) as string;

  if (pathOverride !== undefined) {
    return `${pathOverride}/${path.parse(imagePath).base}`;
  }

  if (pathPrefix && !isManifest) {
    return `${pathPrefix}/${file.getRelativeImagePath(
      outputFilePath,
      imagePath,
    )}`;
  }

  return file.getRelativeImagePath(outputFilePath, imagePath);
};

const generateIconsContentForManifest = (
  savedImages: SavedImage[],
  options: Options,
): ManifestJsonIcon[] =>
  savedImages
    .filter((image) =>
      image.name.startsWith(constants.MANIFEST_ICON_FILENAME_PREFIX),
    )
    .reduce((curr, { path: imagePath, width, height }) => {
      const icon: ManifestJsonIcon = {
        src: generateOutputPath(options, imagePath),
        sizes: `${width}x${height}`,
        type: `image/${file.getExtension(imagePath)}`,
      };
      if (!options.maskable) {
        return curr.concat(icon);
      }
      return curr.concat([
        { ...icon, purpose: 'any' },
        { ...icon, purpose: 'maskable' },
      ]);
    }, [] as ManifestJsonIcon[]);

const generateAppleTouchIconHtml = (
  savedImages: SavedImage[],
  options: Options,
): string =>
  savedImages
    .filter((image) =>
      image.name.startsWith(constants.APPLE_ICON_FILENAME_PREFIX),
    )
    .map(({ path: imagePath }) =>
      constants.APPLE_TOUCH_ICON_META_HTML(
        generateOutputPath(options, imagePath),
        options.xhtml,
      ),
    )
    .join('');

const generateFaviconHtml = (
  savedImages: SavedImage[],
  options: Options,
): string =>
  savedImages
    .filter((image) => image.name.startsWith(constants.FAVICON_FILENAME_PREFIX))
    .map(({ width, path: imagePath }) =>
      constants.FAVICON_META_HTML(
        width,
        generateOutputPath(options, imagePath),
        lookup(imagePath) as string,
        options.xhtml,
      ),
    )
    .join('');

const generateMsTileImageHtml = (
  savedImages: SavedImage[],
  options: Options,
): string =>
  savedImages
    .filter((image) => image.name.startsWith(constants.MS_ICON_FILENAME_PREFIX))
    .map(({ width, height, path: imagePath }) =>
      constants.MSTILE_IMAGE_META_HTML(
        constants.MSTILE_SIZE_ELEMENT_NAME_MAP[`${width}x${height}`],
        generateOutputPath(options, imagePath),
        options.xhtml,
      ),
    )
    .join('');

const generateAppleLaunchImageHtml = (
  savedImages: SavedImage[],
  options: Options,
  darkMode: boolean,
): string =>
  savedImages
    .filter((image) =>
      image.name.startsWith(constants.APPLE_SPLASH_FILENAME_PREFIX),
    )
    .map(({ width, height, path: imagePath, scaleFactor, orientation }) =>
      constants.APPLE_LAUNCH_SCREEN_META_HTML(
        width,
        height,
        generateOutputPath(options, imagePath),
        scaleFactor as number,
        orientation,
        darkMode,
        options.xhtml,
      ),
    )
    .join('');

const generateHtmlForIndexPage = (
  savedImages: SavedImage[],
  options: Options,
): HTMLMeta => {
  const htmlMeta: HTMLMeta = {
    [HTMLMetaNames.appleMobileWebAppCapable]: `<meta name="apple-mobile-web-app-capable" content="yes"${
      options.xhtml ? ' /' : ''
    }>
`,
  };

  if (!options.splashOnly) {
    if (options.favicon) {
      htmlMeta[HTMLMetaNames.favicon] = `${generateFaviconHtml(
        savedImages,
        options,
      )}`;
    }

    htmlMeta[HTMLMetaNames.appleTouchIcon] = `${generateAppleTouchIconHtml(
      savedImages,
      options,
    )}`;
  }

  if (!options.iconOnly) {
    if (options.darkMode) {
      htmlMeta[HTMLMetaNames.appleLaunchImageDarkMode] =
        `${generateAppleLaunchImageHtml(savedImages, options, true)}`;
    } else {
      htmlMeta[HTMLMetaNames.appleLaunchImage] =
        `${generateAppleLaunchImageHtml(savedImages, options, false)}`;
    }
  }

  if (options.mstile) {
    htmlMeta[HTMLMetaNames.msTileImage] = `${generateMsTileImageHtml(
      savedImages,
      options,
    )}`;
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
  if (!(await file.isPathAccessible(manifestJsonFilePath, file.WRITE_ACCESS))) {
    throw Error(`Cannot write to manifest json file ${manifestJsonFilePath}`);
  }

  const manifestJson = JSON.parse(
    (await file.readFile(manifestJsonFilePath)) as unknown as string,
  );

  const newManifestContent = {
    ...manifestJson,
    icons: [...manifestContent],
  };

  if (manifestJson.icons) {
    newManifestContent.icons = [
      ...newManifestContent.icons,
      ...manifestJson.icons.filter(
        (icon: ManifestJsonIcon) =>
          !manifestContent.some((man) => man.sizes === icon.sizes),
      ),
    ];
  }

  return file.writeFile(
    manifestJsonFilePath,
    JSON.stringify(newManifestContent, null, 2),
  );
};

const formatMetaTags = (htmlMeta: HTMLMeta): string =>
  constants.HTML_META_ORDERED_SELECTOR_LIST.reduce(
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

const HEAD_SELECTOR = 'head';

// htmlparser2 (used in xhtml mode) parses markup as-is with no tree
// correction, while parse5 implements the full HTML5 parsing algorithm and
// synthesizes a <head>/<body> for any document that is missing one.
const parseHtmlDocument = (html: string, xhtml: boolean): Document =>
  xhtml
    ? parseDocument(html, { xmlMode: true })
    : parse(html, { treeAdapter: htmlparser2TreeAdapter });

const parseHtmlFragment = (html: string, xhtml: boolean): Document =>
  xhtml
    ? parseDocument(html, { xmlMode: true })
    : parseFragment(html, { treeAdapter: htmlparser2TreeAdapter });

const insertNodesIntoHead = (
  head: Element,
  nodes: ChildNode[],
  atStart: boolean,
): void => {
  if (atStart) {
    // prependChild always inserts at index 0, so prepending in reverse
    // order keeps the nodes' original relative order in the result.
    [...nodes].reverse().forEach((node) => prependChild(head, node));
  } else {
    // domutils' appendChild removes the node from its old parent, which is
    // `nodes` itself here (fragment.children) — mutating the array a
    // forEach is iterating over skips every other element. Iterate a copy.
    [...nodes].forEach((node) => appendChild(head, node));
  }
};

const addMetaTagsToIndexPage = async (
  htmlMeta: HTMLMeta,
  indexHtmlFilePath: string,
  xhtml: boolean,
): Promise<void> => {
  if (!(await file.isPathAccessible(indexHtmlFilePath, file.WRITE_ACCESS))) {
    throw Error(`Cannot write to index html file ${indexHtmlFilePath}`);
  }

  const indexHtmlFile = (await file.readFile(indexHtmlFilePath)).toString();
  const document = parseHtmlDocument(indexHtmlFile, xhtml);

  const head = selectOne<AnyNode, Element>(HEAD_SELECTOR, document);
  if (!head) {
    throw Error(
      `Cannot find <head> element in index html file ${indexHtmlFilePath}`,
    );
  }

  const hasDarkModeElement = (): boolean => {
    const darkModeMeta = constants.HTML_META_ORDERED_SELECTOR_LIST.find(
      (m: HTMLMetaSelector) =>
        m.name === HTMLMetaNames.appleLaunchImageDarkMode,
    );
    if (darkModeMeta) {
      return !!selectOne<AnyNode, Element>(darkModeMeta.selector, document);
    }
    return false;
  };

  // TODO: Find a way to remove tags without leaving newlines behind
  constants.HTML_META_ORDERED_SELECTOR_LIST.forEach(
    (meta: HTMLMetaSelector) => {
      if (htmlMeta.hasOwnProperty(meta.name) && htmlMeta[meta.name] !== '') {
        const content = `${htmlMeta[meta.name]}`;

        selectAll<AnyNode, Element>(meta.selector, document).forEach(
          removeElement,
        );

        const nodes = parseHtmlFragment(content, xhtml).children;

        // Because meta tags with dark mode media attr has to be declared after the regular splash screen meta tags
        if (
          meta.name === HTMLMetaNames.appleLaunchImage &&
          hasDarkModeElement()
        ) {
          insertNodesIntoHead(head, nodes, true);
        } else {
          insertNodesIntoHead(head, nodes, false);
        }
      }
    },
  );

  return file.writeFile(
    indexHtmlFilePath,
    htmlFormat.formatHtml(render(document)),
  );
};

export default {
  formatMetaTags,
  addIconsToManifest,
  addMetaTagsToIndexPage,
  generateHtmlForIndexPage,
  generateBrowserConfigXml: generateMsTileImageHtml,
  generateIconsContentForManifest,
};
