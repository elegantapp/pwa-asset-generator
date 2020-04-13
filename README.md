# pwa-asset-generator
[![npm](https://img.shields.io/npm/v/pwa-asset-generator?color=brightgreen)](https://www.npmjs.com/package/pwa-asset-generator) [![node](https://img.shields.io/node/v/pwa-asset-generator)](https://www.npmjs.com/package/pwa-asset-generator) [![Build Status](https://github.com/onderceylan/pwa-asset-generator/workflows/CI/badge.svg)](https://github.com/onderceylan/pwa-asset-generator/actions?workflow=CI) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-brightgreen.svg)](https://github.com/semantic-release/semantic-release) [![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=onderceylan/pwa-asset-generator)](https://dependabot.com)

> PWA asset generator based on Puppeteer. Automatically generates icons and splash screens guided by Web App Manifest specs and Apple Human Interface guidelines. Updates manifest.json and index.html files with the generated images.

![Usage demonstration](https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/demo.gif)

## Motivation — [read the full blog post here](https://itnext.io/pwa-splash-screen-and-icon-generator-a74ebb8a130)

When you build a PWA with a goal of providing native-like experiences on multiple platforms and stores, you need to meet with the criteria of those platforms and stores with your PWA assets; icon sizes and splash screens. Such criteria are;

* Google's Android platform respects Web App Manifest API specs and it expects you to provide at least 2 icon sizes in your manifest file - https://developers.google.com/web/fundamentals/web-app-manifest/#icons 🤔

* As it's noted on Microsoft docs, your PWA has to meet specific image criteria declared on Web App Manifest in order to be automatically packaged for Microsoft Store - https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps/get-started#web-app-manifest 🤔

* Apple's iOS currently doesn't support Web App Manifest API specs. You need to introduce custom html tags to set icons and splash screens to your PWA 🤔
    * You need to introduce a special html link tag with rel `apple-touch-icon` to provide icons for your PWA when it's added to home screen. Read more about it on [Apple's Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) and [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).
    * You need to introduce a special html link tag with rel `apple-touch-startup-image` to provide a splash screen for your PWA to display when it's opened and in the background. You need to create a splash screen image for every resolution on [Apple's Launch Screen Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/launch-screen/#static-launch-screen-images-not-recommended) and html tag with media attr for each image like `<link rel="apple-touch-startup-image" href="temp/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">`. Unfortunately, this requirement is not documented on the [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) sufficiently.

Creating icon and splash screen images for all the platforms, maintaining sizes and quality for all and adding html tags for each image can be overwhelming. So, why not automate it? 💡

## Features

PWA Asset Generator automates the image generation in a creative way. Having [Puppeteer](https://pptr.dev) at its core enables lots of possibilities.

* Generates both icons and splash screens with optional `--icon-only` `--splash-only` `--landscape-only` and `--portrait-only` flags ✨

* Updates your `manifest.json` and `index.html` files automatically for declaring generated image assets 🙌

* Scrapes latest specs from Apple Human Interface guidelines website via Puppeteer to make your PWA ready for all/recent iOS devices out there 🤖

    * Supports offline mode and uses static spec data when things go wrong with scraping 📴
    * Updates static spec data before each release automatically and [monitors spec changes everyday](https://github.com/onderceylan/pwa-asset-generator/actions?query=workflow%3A%22Sanity+Check%22) 🔄

* Uses the Chrome browser as it’s a canvas of your fav image editor. It uses a shell HTML on the fly as an artboard and centers your logo before taking screenshots for each resolution via Puppeteer 🤖

* You can provide your source in multiple formats; a local image file, a local HTML file, a remote image or HTML file 🙌

    * When it’s an image source, it is centered over the background option you provide 🌅
    * When it’s an HTML source, you can go as creative as you like; position your logo, use SVG filters, use variable fonts, use gradient backgrounds, use typography and etc. Your html file is rendered on Chrome before taking screenshots for each resolution 🎨

* It uses [puppeteer-core](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core) instead of puppeteer and only installs Chromium if it doesn't exist on the system. Saves waste of ~110-150mb of disk space and many seconds from the world per each user 🌎⚡️

* Supports dark mode splash screens on iOS! So, you can provide both light 🌕 and dark 🌚 splash screen images to differentiate your apps look & feel based on user preference 🌙

## Install

```
$ npm install --global pwa-asset-generator
```

## One-off execution

```
$ npx pwa-asset-generator
```

Read more about npx [here](https://blog.npmjs.org/post/162869356040/introducing-npx-an-npm-package-runner).

## Usage

```
$ pwa-asset-generator --help

  Usage
    $ pwa-asset-generator [source-file] [output-folder]

    The assets will be saved to the folder where the command is executed if no output-folder provided.

  Options
    -b --background             Page background to use when image source is provided: css value  [default: transparent]
    -o --opaque                 Shows white as canvas background and generates images without transparency  [default: true]
    -p --padding                Padding to use when image source provided: css value  [default: "10%"]
    -s --scrape                 Scraping Apple Human Interface guidelines to fetch splash screen specs  [default: true]
    -m --manifest               Web app manifest file path to automatically update manifest file with the generated icons
    -i --index                  Index HTML file path to automatically put splash screen and icon meta tags in
    -a --path                   Path prefix to prepend for href links generated for meta tags
    -h --path-override          Override the path of images used in href/src tags of manifest and HTML files
    -t --type                   Image type: png|jpg|jpeg  [default: png]
    -q --quality                Image quality: 0...100 (Only for JPEG)  [default: 100]
    -h --splash-only            Only generate splash screens  [default: false]
    -c --icon-only              Only generate icons  [default: false]
    -f --favicon                Generate favicon image and HTML meta tag  [default: false]
    -e --maskable               Declare icons in manifest file as maskable icons  [default: true]
    -l --landscape-only         Only generate landscape splash screens  [default: false]
    -r --portrait-only          Only generate portrait splash screens  [default: false]
    -d --dark-mode              Generate iOS splash screen meta with (prefers-color-scheme: dark) media attr  [default: false]
    -u --single-quotes          Generate HTML meta tags with single quotes  [default: false]
    -x --xhtml                  Generate HTML meta tags by self-closing the tags  [default: false]
    -g --log                    Logs the steps of the library process  [default: true]

  Examples
    $ pwa-asset-generator logo.html
    $ pwa-asset-generator logo.svg -i ./index.html -m ./manifest.json
    $ pwa-asset-generator https://your-cdn-server.com/assets/logo.png ./ -t jpg -q 90 --splash-only --portrait-only
    $ pwa-asset-generator logo.svg ./assets --splash-only --xhtml --single-quotes
    $ pwa-asset-generator logo.svg ./assets --scrape false --icon-only --path "%PUBLIC_URL%"
    $ pwa-asset-generator logo.svg ./assets --icon-only --favicon --opaque false --maskable false
    $ pwa-asset-generator logo.svg ./assets --dark-mode --background dimgrey --splash-only --type jpeg --quality 80
    $ pwa-asset-generator logo.svg ./assets --padding "calc(50vh - 5%) calc(50vw - 10%)" --path-override "./your-custom-image-folder-path"
    $ pwa-asset-generator https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png ./temp -p "15%" -b "linear-gradient(to right, #fa709a 0%, #fee140 100%)"

  Flag examples
    --background "rgba(255, 255, 255, .5)"
    --opaque false
    --padding "10px"
    --scrape false
    --manifest ./src/manifest.json
    --index ./src/index.html
    --path "%PUBLIC_URL%"
    --path-override "./your-custom-image-folder-path"
    --type jpg
    --quality 80
    --splash-only
    --icon-only
    --favicon
    --maskable false
    --landscape-only
    --portrait-only
    --dark-mode
    --single-quotes
    --xhtml
    --log false
```

### Module

```javascript
const pwaAssetGenerator = require('pwa-asset-generator');

(async () => {
  const { savedImages, htmlMeta, manifestJsonContent } = await pwaAssetGenerator.generateImages(
    'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png',
    './temp',
    {
      scrape: false,
      background: "linear-gradient(to right, #fa709a 0%, #fee140 100%)",
      splashOnly: true,
      portraitOnly: true,
      log: false
    });
})();
```

## FAQ

### How to make an image smaller or larger relative to the background?
The default value for the padding surrounding the image is 10%. But it's just a css padding value that you can configure and override yourself with **-p --padding** option.

1. You can use a more advanced padding value based on your taste and goal;

    **Larger logo:** `--padding "calc(50vh - 20%) calc(50vw - 40%)"`

    **Smaller logo:** `--padding "calc(50vh - 5%) calc(50vw - 10%)"`

2. You can create your own html input file which uses css media queries and provides different padding options based on breakpoints: https://material.io/design/layout/responsive-layout-grid.html#breakpoints

### How can I generate a PNG image with transparency?
Although the default background color is **transparent**, there's another option that you need to use to generate transparent images: **opaque**.

You need to run your CLI command with `--opaque false` option in order to get the transparency; `pwa-asset-generator logo.svg --opaque false`.

This might be confusing for some but it's necessary to support the use of background values with alpha channels.

### How can I generate a transparent favicon, and app icons with opaque background?
Default behaviour of the library is to generate a favicon along with app icons. So, it's not possible to generate one without other.

However, you can use this workaround to work with this edge case:

* First, generate a favicon with `--opaque false --icon-only --favicon` options.
* Then, overwrite app icons with `--background "#FFF" --icon-only` options.

## Troubleshooting

### "No usable sandbox!" error on Linux
In case of getting "No usable sandbox!" error on Linux, you need to enable [system sandboxing](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox).
