import { Orientation } from '../models/image';

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
  },

  PUPPETEER_LAUNCH_ARGS: [
    '--log-level=3', // Fatal only
    '--no-default-browser-check',
    '--disable-infobars',
    '--disable-web-security',
    '--disable-site-isolation-trials',
    '--no-experiments',
    '--ignore-gpu-blacklist',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-default-apps',
    '--enable-features=NetworkService',
    '--disable-setuid-sandbox',
  ],
  EMULATED_USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36',
  APPLE_HIG_SPLASH_SCR_SPECS_URL:
    'https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/launch-screen/',
  APPLE_HIG_DEVICE_SCALE_FACTOR_SPECS_URL:
    'https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/image-size-and-resolution/',

  // Apple platform specs: https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/
  APPLE_ICON_SIZES: [180, 167, 152, 120],

  // Android platform specs: https://developers.google.com/web/fundamentals/web-app-manifest/#icons
  // Windows platform specs: https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps/get-started
  MANIFEST_ICON_SIZES: [192, 512],

  APPLE_ICON_FILENAME_PREFIX: 'apple-icon',
  APPLE_SPLASH_FILENAME_PREFIX: 'apple-splash',
  MANIFEST_ICON_FILENAME_PREFIX: 'manifest-icon',
  APPLE_HIG_SPLASH_SCR_SPECS_DATA_GRID_SELECTOR: 'table tbody tr',
  WAIT_FOR_SELECTOR_TIMEOUT: 1000,
  BROWSER_SHELL_TIMEOUT: 60000,

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

  APPLE_TOUCH_ICON_META_HTML: (size: number, url: string): string => `\
<link rel="apple-touch-icon" sizes="${size}x${size}" href="${url}">
`,

  APPLE_LAUNCH_SCREEN_META_HTML: (
    width: number,
    height: number,
    url: string,
    scaleFactor: number,
    orientation: Orientation,
  ): string => {
    /* eslint-disable */
    if (orientation === 'portrait') {
      return `\
<link rel="apple-touch-startup-image"
    href="${url}"
    media="(device-width: ${width / scaleFactor}px) and (device-height: ${height / scaleFactor}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: ${orientation})">
`;
    }

    // As weird as it gets, Apple expects same device width and height values from portrait orientation, for landscape
    return `\
<link rel="apple-touch-startup-image"
    href="${url}"
    media="(device-width: ${height / scaleFactor}px) and (device-height: ${width / scaleFactor}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: ${orientation})">
`;
    /* eslint-enable */
  },

  APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA: [
    {
      device: '12.9" iPad Pro',
      portrait: { width: 2048, height: 2732 },
      landscape: { width: 2732, height: 2048 },
      scaleFactor: 2,
    },
    {
      device: '11" iPad Pro',
      portrait: { width: 1668, height: 2388 },
      landscape: { width: 2388, height: 1668 },
      scaleFactor: 2,
    },
    {
      device: '10.5" iPad Pro',
      portrait: { width: 1668, height: 2224 },
      landscape: { width: 2224, height: 1668 },
      scaleFactor: 2,
    },
    {
      device: '9.7" iPad',
      portrait: { width: 1536, height: 2048 },
      landscape: { width: 2048, height: 1536 },
      scaleFactor: 2,
    },
    {
      device: '7.9" iPad mini 4',
      portrait: { width: 1536, height: 2048 },
      landscape: { width: 2048, height: 1536 },
      scaleFactor: 2,
    },
    {
      device: 'iPhone XS Max',
      portrait: { width: 1242, height: 2688 },
      landscape: { width: 2688, height: 1242 },
      scaleFactor: 3,
    },
    {
      device: 'iPhone XS',
      portrait: { width: 1125, height: 2436 },
      landscape: { width: 2436, height: 1125 },
      scaleFactor: 3,
    },
    {
      device: 'iPhone XR',
      portrait: { width: 828, height: 1792 },
      landscape: { width: 1792, height: 828 },
      scaleFactor: 2,
    },
    {
      device: 'iPhone X',
      portrait: { width: 1125, height: 2436 },
      landscape: { width: 2436, height: 1125 },
      scaleFactor: 3,
    },
    {
      device: 'iPhone 8 Plus',
      portrait: { width: 1242, height: 2208 },
      landscape: { width: 2208, height: 1242 },
      scaleFactor: 3,
    },
    {
      device: 'iPhone 8',
      portrait: { width: 750, height: 1334 },
      landscape: { width: 1334, height: 750 },
      scaleFactor: 2,
    },
    {
      device: 'iPhone 7 Plus',
      portrait: { width: 1242, height: 2208 },
      landscape: { width: 2208, height: 1242 },
      scaleFactor: 3,
    },
    {
      device: 'iPhone 7',
      portrait: { width: 750, height: 1334 },
      landscape: { width: 1334, height: 750 },
      scaleFactor: 2,
    },
    {
      device: 'iPhone 6s Plus',
      portrait: { width: 1242, height: 2208 },
      landscape: { width: 2208, height: 1242 },
      scaleFactor: 3,
    },
    {
      device: 'iPhone 6s',
      portrait: { width: 750, height: 1334 },
      landscape: { width: 1334, height: 750 },
      scaleFactor: 2,
    },
    {
      device: 'iPhone SE',
      portrait: { width: 640, height: 1136 },
      landscape: { width: 1136, height: 640 },
      scaleFactor: 2,
    },
  ],
};
