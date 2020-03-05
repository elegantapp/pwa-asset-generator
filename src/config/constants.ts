import { Orientation } from '../models/image';
import { HTMLMetaNames, HTMLMetaSelector } from '../models/meta';
import APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA from './apple-fallback-data.json';

const HTML_META_ORDERED_SELECTOR_LIST: HTMLMetaSelector[] = [
  {
    name: HTMLMetaNames.favicon,
    selector: 'link[rel="icon"]',
  },
  {
    name: HTMLMetaNames.appleTouchIcon,
    selector: 'link[rel="apple-touch-icon"]',
  },
  {
    name: HTMLMetaNames.appleMobileWebAppCapable,
    selector: 'meta[name="apple-mobile-web-app-capable"]',
  },
  {
    name: HTMLMetaNames.appleLaunchImage,
    selector:
      'link[rel="apple-touch-startup-image"]:not([media^="(prefers-color-scheme: dark)"])',
  },
  {
    name: HTMLMetaNames.appleLaunchImageDarkMode,
    selector:
      'link[rel="apple-touch-startup-image"][media^="(prefers-color-scheme: dark)"]',
  },
];

export default {
  FLAGS: {
    background: {
      type: 'string',
      alias: 'b',
      default: 'transparent',
    },
    manifest: {
      type: 'string',
      alias: 'm',
    },
    index: {
      type: 'string',
      alias: 'i',
    },
    path: {
      type: 'string',
      alias: 'a',
    },
    pathOverride: {
      type: 'string',
      alias: 'h',
    },
    opaque: {
      type: 'boolean',
      alias: 'o',
      default: true,
    },
    scrape: {
      type: 'boolean',
      alias: 's',
      default: true,
    },
    padding: {
      type: 'string',
      alias: 'p',
      default: '10%',
    },
    type: {
      type: 'string',
      alias: 't',
      default: 'png',
    },
    quality: {
      type: 'number',
      alias: 'q',
      default: 100,
    },
    splashOnly: {
      type: 'boolean',
      alias: 'h',
      default: false,
    },
    iconOnly: {
      type: 'boolean',
      alias: 'c',
      default: false,
    },
    landscapeOnly: {
      type: 'boolean',
      alias: 'l',
      default: false,
    },
    portraitOnly: {
      type: 'boolean',
      alias: 'r',
      default: false,
    },
    log: {
      type: 'boolean',
      alias: 'g',
      default: true,
    },
    singleQuotes: {
      type: 'boolean',
      alias: 'u',
      default: false,
    },
    favicon: {
      type: 'boolean',
      alias: 'f',
      default: false,
    },
    darkMode: {
      type: 'boolean',
      alias: 'd',
      default: false,
    },
  },

  PUPPETEER_LAUNCH_ARGS: [
    '--log-level=3', // Fatal only
    '--no-default-browser-check',
    '--disable-infobars',
    '--no-experiments',
    '--ignore-gpu-blacklist',
    '--disable-gpu',
    '--disable-default-apps',
    '--enable-features=NetworkService',
    '--disable-features=TranslateUI',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
    '--headless',
  ],

  CHROME_LAUNCHER_DEBUG_PORT: 9222,
  CHROME_LAUNCHER_MAX_CONN_RETRIES: 10,
  EMULATED_USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36',
  APPLE_HIG_SPLASH_SCR_SPECS_URL:
    'https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/',
  APPLE_HIG_DEVICE_SCALE_FACTOR_SPECS_URL:
    'https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/image-size-and-resolution/',

  // Apple platform specs: https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/
  APPLE_ICON_SIZES: [180, 167, 152, 120],

  // Android platform specs: https://developers.google.com/web/fundamentals/web-app-manifest/#icons
  // Windows platform specs: https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps/get-started
  MANIFEST_ICON_SIZES: [192, 512],

  FAVICON_SIZES: [196],

  HTML_META_ORDERED_SELECTOR_LIST,

  FAVICON_FILENAME_PREFIX: 'favicon',
  APPLE_ICON_FILENAME_PREFIX: 'apple-icon',
  APPLE_SPLASH_FILENAME_PREFIX: 'apple-splash',
  APPLE_SPLASH_FILENAME_DARK_MODE_POSTFIX: '-dark',
  MANIFEST_ICON_FILENAME_PREFIX: 'manifest-icon',
  APPLE_HIG_SPLASH_SCR_SPECS_DATA_GRID_SELECTOR: 'table tbody tr',
  WAIT_FOR_SELECTOR_TIMEOUT: 1000,
  BROWSER_TIMEOUT: 10000,

  FAVICON_META_HTML: (size: number, url: string, mimeType: string): string =>
    `<link rel="icon" type="${mimeType}" sizes="${size}x${size}" href="${url}">
`,

  SHELL_HTML_FOR_LOGO: (
    imgPath: string,
    backgroundColor = 'transparent',
    padding: string,
  ): string => `\
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      background: ${backgroundColor};
      height: 100vh;
      padding: ${padding};
      box-sizing: border-box;
    }
    img {
      width: 100%;
      height: 100%;
      margin: 0 auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
<img src="${imgPath}">
</body>
</html>`,

  APPLE_TOUCH_ICON_META_HTML: (size: number, url: string): string =>
    `<link rel="apple-touch-icon" sizes="${size}x${size}" href="${url}">
`,

  APPLE_LAUNCH_SCREEN_META_HTML: (
    width: number,
    height: number,
    url: string,
    scaleFactor: number,
    orientation: Orientation,
    darkMode: boolean,
  ): string => {
    /* eslint-disable */
    if (orientation === 'portrait') {
      return `\
<link rel="apple-touch-startup-image" href="${url}" media="${darkMode ? '(prefers-color-scheme: dark) and ' : ''}(device-width: ${width / scaleFactor}px) and (device-height: ${height / scaleFactor}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: ${orientation})">
`;
    }

    // As weird as it gets, Apple expects same device width and height values from portrait orientation, for landscape
    return `\
<link rel="apple-touch-startup-image" href="${url}" media="${darkMode ? '(prefers-color-scheme: dark) and ' : ''}(device-width: ${height / scaleFactor}px) and (device-height: ${width / scaleFactor}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: ${orientation})">
`;
    /* eslint-enable */
  },

  APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA,
};
