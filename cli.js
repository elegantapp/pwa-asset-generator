#!/usr/bin/env node

const meow = require('meow');
const preLogger = require('./helpers/logger');
const main = require('./main');

const logger = preLogger('cli');
const cli = meow(
  `
$ pwa-asset-generator --help

  Usage
    $ pwa-asset-generator [source] [output-folder]
    
    The assets will be saved to the folder where the command is executed if no output-folder provided.
    
  Options
    -b --background             Page background to use when image source is provided: css value  [default: transparent]
    -o --opaque                 Making screenshots to be saved with a background color  [default: true]
    -p --padding                Padding to use when image source provided: css value  [default: "10%"]
    -s --scrape                 Scraping Apple Human Interface Guidelines to fetch splash screen specs  [default: true]
    -m --manifest               Web app manifest file path to automatically update manifest file with the generated images
    -i --index                  Index html file path to automatically put splash screen meta tags in
    -t --type                   Image type: png|jpeg  [default: png]
    -q --quality                Image quality: 0...100 (Only for JPEG)  [default: 100]
    -h --splash-only            Only generate splash screens  [default: false]
    -c --icon-only              Only generate icons  [default: false]
    -l --landscape-only         Only generate landscape splash screens  [default: false]
    -r --portrait-only          Only generate portrait splash screens  [default: false]
    
  Examples
    $ pwa-asset-generator logo.html .
    $ pwa-asset-generator https://your-cdn-server.com/assets/logo.png . -t jpeg -q 90 --splash-only --portrait-only
    $ pwa-asset-generator logo.svg ./assets --scrape false --icon-only
    $ pwa-asset-generator https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png -p "15%" -b "linear-gradient(to right, #fa709a 0%, #fee140 100%)"

  Flag examples
    --background="rgba(255, 255, 255, .5)"
    --opaque=false
    --padding="10px"
    --scrape=false
    --manifest=./src/manifest.json
    --index=./src/index.html
    --type=jpeg
    --quality=80
    --splash-only
    --icon-only
    --landscape-only
    --portrait-only
`,
  {
    flags: {
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
    },
  },
);

(async () => {
  try {
    await main.generateImages(cli.input[0], cli.input[1], cli.flags, logger);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
