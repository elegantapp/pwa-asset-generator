# pwa-asset-generator ✨
[![npm](https://img.shields.io/npm/v/pwa-asset-generator?color=brightgreen)](https://www.npmjs.com/package/pwa-asset-generator) [![node](https://img.shields.io/node/v/pwa-asset-generator)](https://www.npmjs.com/package/pwa-asset-generator) [![Build Status](https://github.com/onderceylan/pwa-asset-generator/workflows/CI/badge.svg)](https://github.com/onderceylan/pwa-asset-generator/actions?workflow=CI) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-brightgreen.svg)](https://github.com/semantic-release/semantic-release) [![Buy me a coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-blueviolet.svg)](https://www.buymeacoffee.com/onder)

> Automates PWA asset generation and image declaration. Automatically generates icon and splash screen images, favicons and mstile images. Updates manifest.json and index.html files with the generated images according to Web App Manifest specs and Apple Human Interface guidelines.

![Usage demonstration](https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/demo.gif)

## Motivation — [read the full blog post here](https://itnext.io/pwa-splash-screen-and-icon-generator-a74ebb8a130)

![A PWA on iOS with icons and splash screens](https://onderceylan.github.io/pwa-asset-generator/static/ios-demo-blm.png)

When you build a PWA with a goal of providing native-like experiences on multiple platforms and stores, you need to meet with the criteria of those platforms and stores with your PWA assets; icon sizes and splash screens. Such criteria are;

* Google's Android platform respects Web App Manifest API specs, and it expects you to provide at least 2 icon sizes in your manifest file - https://web.dev/add-manifest/#icons 🤔

* Apple's iOS currently doesn't support Web App Manifest API specs. You need to introduce custom html tags to set icons and splash screens to your PWA 🤔
    * You need to introduce a special html link tag with rel `apple-touch-icon` to provide icons for your PWA when it's added to home screen. Read more about it on [Apple's Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) and [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).
    * You need to introduce a special html link tag with rel `apple-touch-startup-image` to provide a splash screen for your PWA to display when it's opened and in the background. You need to create a splash screen image for every resolution on [Apple's Launch Screen Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/launch-screen/#static-launch-screen-images-not-recommended) and html tag with media attr for each image like `<link rel="apple-touch-startup-image" href="temp/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">`. Unfortunately, this requirement is not documented on the [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) sufficiently.

Creating icon and splash screen images for all the platforms, maintaining sizes and quality for all and adding html tags for each image can be overwhelming. So, why not automate it? 💡

## Features

PWA Asset Generator automates the image generation in a creative way. Having [Puppeteer](https://pptr.dev) at its core enables lots of possibilities.

* Generates both icons and splash screens with optional `--icon-only` `--splash-only` `--landscape-only` and `--portrait-only` flags ✨

* Updates your `manifest.json` and `index.html` files automatically for declaring generated image assets 🙌

* Scrapes the latest specs from Apple Human Interface guidelines website via Puppeteer to make your PWA ready for all/recent iOS devices out there 🤖

    * Supports offline mode and uses static spec data when things go wrong with scraping 📴
    * Updates static spec data before each release automatically and [monitors spec changes everyday](https://github.com/onderceylan/pwa-asset-generator/actions?query=workflow%3A%22Sanity+Check%22) 🔄

* Uses the Chrome browser as it’s a canvas of your fav image editor. It uses a shell HTML on the fly as an art board and centers your logo before taking screenshots for each resolution via Puppeteer 🤖

* You can provide your source in multiple formats; a local image file, a local HTML file, a remote image or HTML file 🙌

    * When it’s an image source, it is centered over the background option you provide 🌅
    * When it’s an HTML source, you can go as creative as you like; position your logo, use SVG filters, use variable fonts, use gradient backgrounds, use media queries while generating dark mode splash screens, use typography and etc. Your HTML file is rendered on Chrome before taking screenshots for each resolution 🎨

* Uses [puppeteer-core](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core) instead of puppeteer and only installs Chromium if it doesn't exist on the system. Saves waste of ~110-150mb of disk space and many seconds from the world per each user 🌎⚡️

* Supports dark mode splash screens on iOS! So, you can provide both light 🌕 and dark 🌚 splash screen images to differentiate your apps look & feel based on user preference 🌙

* Supports [PWA maskable icons](https://web.dev/maskable-icon/) by declaring them in manifest file adaptively 🖼

* Supports flexible tag formatting and path customization options to comply with various development environments. You can adjust your output using single quotes `--single-quotes`, self-closing tags `--xhtml`, path prefixes `--path` and path overrides `--path-override` 📝

* Supports generating classic web app icons such as favicons `--favicon` and Windows static tiles `--mstile` ⏪

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
    -v --path-override          Override the path of images used in href/src tags of manifest and HTML files
    -t --type                   Image type: png|jpg  [default: jpg - with the exception of manifest files]
    -q --quality                Image quality: 0...100 (Only for JPG)  [default: 70]
    -h --splash-only            Only generate splash screens  [default: false]
    -c --icon-only              Only generate icons  [default: false]
    -f --favicon                Generate favicon image and HTML meta tag  [default: false]
    -w --mstile                 Generate Windows static tile icons and HTML meta tags  [default: false]
    -e --maskable               Declare icons in manifest file as maskable icons  [default: true]
    -l --landscape-only         Only generate landscape splash screens  [default: false]
    -r --portrait-only          Only generate portrait splash screens  [default: false]
    -d --dark-mode              Generate iOS splash screen meta with (prefers-color-scheme: dark) media attr  [default: false]
    -u --single-quotes          Generate HTML meta tags with single quotes  [default: false]
    -x --xhtml                  Generate HTML meta tags by self-closing the tags  [default: false]
    -g --log                    Logs the steps of the library process  [default: true]
    -n --no-sandbox             Disable sandbox on bundled Chromium on Linux platforms - not recommended  [default: false]

  Examples
    $ pwa-asset-generator logo.html
    $ pwa-asset-generator logo.svg -i ./index.html -m ./manifest.json
    $ pwa-asset-generator https://your-cdn-server.com/assets/logo.png ./ -t jpg -q 90 --splash-only --portrait-only
    $ pwa-asset-generator logo.svg ./assets --splash-only --xhtml --single-quotes
    $ pwa-asset-generator logo.svg ./assets --scrape false --icon-only --path "%PUBLIC_URL%"
    $ pwa-asset-generator logo.svg ./assets --icon-only --favicon --opaque false --maskable false --type png
    $ pwa-asset-generator logo.svg ./assets --dark-mode --background dimgrey --splash-only --quality 80
    $ pwa-asset-generator logo.svg ./assets --padding "calc(50vh - 5%) calc(50vw - 10%)" --path-override "./your-custom-image-folder-path"
    $ pwa-asset-generator https://onderceylan.github.io/pwa-asset-generator/static/logo.png ./temp -p "15%" -b "linear-gradient(to right, #fa709a 0%, #fee140 100%)"
    $ pwa-asset-generator https://onderceylan.github.io/pwa-asset-generator/static/blm.png ./blm -p "15%" -b "linear-gradient(to right top, #d16ba5, #c777b9, #ba83ca, #aa8fd8, #9a9ae1, #8aa7ec, #79b3f4, #69bff8, #52cffe, #41dfff, #46eefa, #5ffbf1)"

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
    --mstile
    --maskable false
    --landscape-only
    --portrait-only
    --dark-mode
    --single-quotes
    --xhtml
    --log false
```

### Module

pwa-asset-generator is not only a CLI. It's a CLI wrapper around a JavaScript module. It's possible to access the underlying API of the library as it's described in below example;

```javascript
const pwaAssetGenerator = require('pwa-asset-generator');

// Generate images over a module function call, instead of using CLI commands
(async () => {
  const { savedImages, htmlMeta, manifestJsonContent } = await pwaAssetGenerator.generateImages(
    'https://onderceylan.github.io/pwa-asset-generator/static/logo.png',
    './temp',
    {
      scrape: false,
      background: "linear-gradient(to right, #fa709a 0%, #fee140 100%)",
      splashOnly: true,
      portraitOnly: true,
      log: false
    });
})();

// Access to static data for Apple Device specs that are used for generating launch images
const appleDeviceSpecsForLaunchImages = pwaAssetGenerator.appleDeviceSpecsForLaunchImages;
```

## FAQ

### What kind of image input should I use with this library? What are the safe margins for a logo?

Any image format that a Chrome browser can render within an `<img>` HTML tag, is a compatible image input. It can be an icon, an SVG file, a JPEG or PNG logo, even a WebP image.

pwa-asset-generator uses a Chrome tab as an art board. Your input image is being scaled to fit the viewport of the target device resolution while generating splash screens. Since your input image is being scaled for generating splash screens, it's best advised to use a vector image - like an SVG file as an input.

There's no particular safe margin requirement as 10% padding is added around your image input by default with CSS. That being said, you can customize the padding as it's described in the next answer. The library uses a similar approach while generating icons too, with the same default padding 10% around the image input. See it in action [here at this tweet](https://twitter.com/onderceylan/status/1190657108003282945) to understand the concept.

### How can I make an image smaller or larger relative to the background?
The default value for the padding surrounding the image is 10%. But it's just a css padding value that you can configure and override yourself with **-p --padding** option.

1. You can use a more advanced padding value based on your taste and goal;

    **Larger logo:** `--padding "calc(50vh - 20%) calc(50vw - 40%)"`

    **Smaller logo:** `--padding "calc(50vh - 5%) calc(50vw - 10%)"`

2. You can create your own html input file which uses css media queries and provides different padding options based on breakpoints: https://material.io/design/layout/responsive-layout-grid.html#breakpoints

### How can I generate a PNG image with a transparency?
Although the default background color is **transparent**, there's another option that you need to use for generating transparent images: **opaque**.

You need to run your CLI command with `--opaque false` option in order to get the transparency; `pwa-asset-generator logo.svg --opaque false --type png`.

This might be confusing for some, but it's necessary to support the use of background values with alpha channels.

### How can I generate a transparent favicon, and app icons with opaque background?
Default behaviour of the library is to generate a favicon along with app icons. So, it's not possible to generate one without other.

However, you can use this workaround to work with this edge case:

* First, generate a favicon with `--opaque false --icon-only --favicon --type png` options.
* Then, overwrite app icons with `--background "#FFF" --icon-only` options.

### How can I generate both dark mode and light mode splash screen images?
You need to execute two consequent commands in order to generate both dark mode and light mode splash screens for you PWA running on iOS.

Here's a pair of example commands that can be used for generating both modes;

```bash
npx pwa-asset-generator light-logo.svg ./assets --dark-mode --background dimgrey --splash-only --type jpeg --quality 80 --index ./src/app/index.html
npx pwa-asset-generator dark-logo.svg ./assets --background lightgray --splash-only --type jpeg --quality 80 --index ./src/app/index.html
```

> As you can see from the demonstration of dark mode splash screens [at this tweet](https://twitter.com/onderceylan/status/1188221265632350208), users have to re-add a PWA to the home screen in order to react to a system setting change.
>
> **An existing PWA on a home screen will not be able to recognize changed system settings for it's launch image. This is a limitation on iOS.**

### Are deprecated `device-width` and `device-height` media queries necessary?
Even though they're deprecated, `device-width` and `device-height` media queries are still being used by iOS to declare splash screen images for web apps added to a home screen.

When it's an exact match with device's resolution, iOS displays the splash screen as a launch image on bookmarks / PWAs added to a home screen.

### How can I use JSX syntax to generate the meta tags?
If you don't have HTML files in your project, and have a JSX/TSX files instead, you can either use `--xhtml` option or self-generate the meta tags.

The `--xhtml` option allows you to generate the required meta tags with self-closing them - `< />`. This will allow copying generated tags directly to a JSX/TSX file.

Alternatively, you can use static data that this library exports to generate the required meta tags! pwa-asset-generator exposes the static Apple device specification data via it's module API. Here's an example JSX snippet;

```jsx
import { appleDeviceSpecsForLaunchImages } from 'pwa-asset-generator';

render() {
  return (
    <>
      {appleDeviceSpecsForLaunchImages.map((spec) => {
        return (
          <>
            <link
              key={`apple-splash-${spec.portrait.width}-${spec.portrait.height}`}
              rel="apple-touch-startup-image"
              href={`apple-splash-${spec.portrait.width}-${spec.portrait.height}.png`}
              media={`(device-width: ${spec.portrait.width /
                spec.scaleFactor}px) and (device-height: ${spec.portrait
                .height /
                spec.scaleFactor}px) and (-webkit-device-pixel-ratio: ${
                spec.scaleFactor
              }) and (orientation: portrait)`}
            />
            <link
              key={`apple-splash-${spec.portrait.width}-${spec.portrait.height}`}
              rel="apple-touch-startup-image"
              href={`apple-splash-${spec.portrait.width}-${spec.portrait.height}.png`}
              media={`(device-width: ${spec.portrait.height /
                spec.scaleFactor}px) and (device-height: ${spec.portrait
                .width /
                spec.scaleFactor}px) and (-webkit-device-pixel-ratio: ${
                spec.scaleFactor
              }) and (orientation: landscape)`}
            />
          </>
        );
      })}
    </>
  );
}
```

### My index.html file's format has been changed after an automated update. Is there any way to re-format it?

pwa-asset-generator uses [pretty](https://www.npmjs.com/package/pretty) for formatting your index.html file with a simple, opinionated output.

A recommended way to maintain the same format for your index.html file would be using [Prettier](https://prettier.io/) and adding the following script to your project's package.json file.

```
"format:index": "prettier \"index.html\" --write"
```

Executing `npm run format:index` after using pwa-asset-generator assures the same format for your HTML file.

### When generating PNG images, there's no compression settings. Is there a way to introduce compression for PNG files?

pwa-asset-generator depends on Puppeteer, and it's screenshot API for image generation. Puppeteer doesn't provide compression settings for PNG files for the time being.

However, you can use one of the lossless / lossy compression libraries - like [pngquant](https://pngquant.org/) to compress the generated PNG images.

### Running the CLI command on CI server causes Puppeteer error: "Running as root without --no-sandbox is not supported". How can I disable sandboxing?

In case of getting "No usable sandbox!" error on Linux, you need to enable [system sandboxing](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox).

PAG provides users the `--no-sandbox` option to tackle this issue. Note that there are limitations for this option; it can only be used on Linux platforms and HTML inputs are disabled for security purposes.

### You saved me hours of work with pwa-asset-generator. How can I support this project?

I'm happy to hear you enjoy my work, and it saved you your precious time. Let's call it even! [Make a donation](https://www.buymeacoffee.com/onder) and help me support students in developing countries!
