# pwa-asset-generator 
[![npm](https://img.shields.io/npm/v/pwa-asset-generator?color=brightgreen)](https://www.npmjs.com/package/pwa-asset-generator) [![node](https://img.shields.io/node/v/pwa-asset-generator)]((https://www.npmjs.com/package/pwa-asset-generator)) [![Build Status](https://github.com/onderceylan/pwa-asset-generator/workflows/CI/badge.svg)](https://github.com/onderceylan/pwa-asset-generator/actions) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-brightgreen.svg)](https://github.com/semantic-release/semantic-release)

> PWA asset generator based on Puppeteer. Automatically generates icons and splash screens guided by Web App Manifest specs and Apple Human Interface guidelines. Updates manifest.json and index.html files with the generated images.

![Usage demonstration](https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/demo.gif)

## Motivation — [read full blog post here](https://itnext.io/pwa-splash-screen-and-icon-generator-a74ebb8a130)

When you build a PWA with a goal of providing native-like experiences on multiple platforms and stores, you need to meet with the criteria of those platforms and stores with your PWA assets; icon sizes and splash screens. Such criteria are;

* Google's Android platform respects Web App Manifest API specs and it expects you to provide at least 2 icon sizes in your manifest file - https://developers.google.com/web/fundamentals/web-app-manifest/#icons 🤔

* As it's noted on Microsoft docs, your PWA has to meet specific image criteria declared on Web App Manifest in order to be automatically packaged for Microsoft Store - https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps/get-started#web-app-manifest 🤔

* Apple's iOS currently doesn't support Web App Manifest API specs. You need to introduce custom html tags to set icons and splash screens to your PWA 🤔
    * You need to introduce a special html link tag with rel `apple-touch-icon` to provide icons for your PWA when it's added to home screen. Read more about it on [Apple's Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) and [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html). 
    * You need to introduce a special html link tag with rel `apple-touch-startup-image` to provide splash screen for your PWA to display when it's opened and in the background. You need to create a splash screen image for every resolution on [Apple's Launch Screen Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/launch-screen/#static-launch-screen-images-not-recommended) and html tag with media attr for each image like `<link rel="apple-touch-startup-image" href="temp/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">`. Unfortunately, this requirement is not documented on [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) sufficiently.
    
Creating icon and splash screen images for all the platforms, maintaining sizes and quality for all and adding html tags for each image can be overwhelming. So, why not automate it? 💡

## Features

PWA Asset Generator automates the image generation in a creative way. Having [Puppeteer](https://pptr.dev) in its core enables lots of possibilities. 

* Generates both icons and splash screens with optional `--icon-only` `--splash-only` `--landscape-only` and `--portrait-only` flags ✨

* Updates your `manifest.json` and `index.html` files automatically for declaring generated image assets 🙌

* Scrapes latest specs from Apple Human Interface guidelines website via Puppeteer to make your PWA ready for all/recent iOS devices out there 🤖

    * Supports offline mode and uses static spec data when things go wrong with scraping 📴

* Uses Chrome browser as it’s a canvas of your fav image editor. It uses a shell HTML file as an artboard and centers your logo before taking screenshots for each resolution via Puppeteer 🤖

* You can provide your source in multiple formats; a local image file, a local HTML file, a remote image or HTML file 🙌

    * When it’s an image source, it is centered over the background option you provide 🌅
    * When it’s an HTML source, you can go as creative as you like; position your logo, use SVG filters, use variable fonts, use gradient backgrounds, use typography and etc. Your html file is rendered on Chrome before taking screenshots for each resolution 🎨 

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
    $ pwa-asset-generator [source] [output-folder]
    
    The assets will be saved to the folder where the command is executed if no output-folder provided.
    
  Options
    -b --background             Page background to use when image source is provided: css value  [default: transparent]
    -o --opaque                 Making screenshots to be saved with a background color  [default: true]
    -p --padding                Padding to use when image source provided: css value  [default: "10%"]
    -s --scrape                 Scraping Apple Human Interface guidelines to fetch splash screen specs  [default: true]
    -m --manifest               Web app manifest file path to automatically update manifest file with the generated icons
    -i --index                  Index html file path to automatically put splash screen and icon meta tags in
    -a --path                   Path prefix to prepend for href links generated for meta tags
    -t --type                   Image type: png|jpeg  [default: png]
    -q --quality                Image quality: 0...100 (Only for JPEG)  [default: 100]
    -h --splash-only            Only generate splash screens  [default: false]
    -c --icon-only              Only generate icons  [default: false]
    -l --landscape-only         Only generate landscape splash screens  [default: false]
    -r --portrait-only          Only generate portrait splash screens  [default: false]
    -g --log                    Logs the steps of the library process  [default: true]
    
  Examples
    $ pwa-asset-generator logo.html
    $ pwa-asset-generator logo.svg -i ./index.html -m ./manifest.json
    $ pwa-asset-generator https://your-cdn-server.com/assets/logo.png ./ -t jpeg -q 90 --splash-only --portrait-only
    $ pwa-asset-generator logo.svg ./assets --scrape false --icon-only --path "%PUBLIC_URL%"
    $ pwa-asset-generator https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png ./temp -p "15%" -b "linear-gradient(to right, #fa709a 0%, #fee140 100%)"

  Flag examples
    --background "rgba(255, 255, 255, .5)"
    --opaque false
    --padding "10px"
    --scrape false
    --manifest ./src/manifest.json
    --index ./src/index.html
    --path "%PUBLIC_URL%"
    --type jpeg
    --quality 80
    --splash-only
    --icon-only
    --landscape-only
    --portrait-only
    --log false
```

### Module

```javascript
const pwaAssetGenerator = require('pwa-asset-generator');

(async () => {
  const { savedImages, htmlContent, manifestJsonContent } = await pwaAssetGenerator.generateImages(
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

## Troubleshooting

In case of getting "No usable sandbox!" error on Linux, you need to enable [system sandboxing](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox).
