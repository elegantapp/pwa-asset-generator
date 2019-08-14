#!/usr/bin/env node

const meow = require('meow');
const puppets = require('./puppets');
const pwa = require('./helpers/pwa');
const preLogger = require('./helpers/logger');

const cli = meow(
  `
	Usage
	  $ pwa-asset-generator [source] [output-folder]
	  
	  The assets will be saved to the folder where the command is executed if no output-folder provided.
	  
	Options
	  -b --background             Page background to use when image source is provided  [default: transparent]
	  -o --opaque                 Making screenshots to be saved with a background color  [default: true]
	  -p --padding                Padding to use when image source provided  [default: "10%"]
	  -s --scrape                 Scraping Apple Human Interface Guidelines to fetch splash screen specs  [default: true]
	  -m --manifest               Web app manifest file path to automatically update manifest file with the generated images
	  -i --index                  Index html file path to automatically put splash screen meta tags in
	  
	Examples
	  $ pwa-asset-generator logo.html .
	  $ pwa-asset-generator http://your-cdn-server.com/assets/logo.png .
	  $ pwa-asset-generator logo.svg ./assets --scrape false
	  $ pwa-asset-generator https://cdn.freebiesupply.com/logos/large/2x/amazon-icon-logo-png-transparent.png ./assets -p "20%" -b "linear-gradient(to top, #fad0c4 0%, #ffd1ff 100%)"

	Flag examples
	  --background="rgba(255, 255, 255, .5)"
	  --opaque=false
	  --padding="10px"
	  --scrape=false
	  --manifest=./src/manifest.json
	  --index=./src/index.html
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
    },
  },
);

const [source, output] = cli.input;
const options = cli.flags;
const logger = preLogger('cli');

if (!source) {
  logger.error('Please specify a URL or file path as a source');
  process.exit(1);
}

(async () => {
  try {
    const savedImages = await puppets.generateImages(source, output, options);
    const manifestJsonContent = pwa.generateIconsContentForManifest(
      savedImages,
    );
    const htmlContent = pwa.generateHtmlForIndexPage(savedImages);

    if (options.manifest) {
      await pwa.addIconsToManifest(manifestJsonContent, options.manifest);
      logger.success(
        `Icons are saved to Web App Manifest file ${options.manifest}`,
      );
    } else {
      logger.warn(
        'Web App Manifest file is not specified, printing out the content to console instead',
      );
      logger.success(
        'Below is the icons content for your manifest.json file. You can copy/paste it manually',
      );
      process.stdout.write(
        `\n${JSON.stringify(manifestJsonContent, null, 2)}\n\n`,
      );
    }

    if (options.index) {
      await pwa.addMetaTagsToIndexPage(htmlContent, options.index);
      logger.success(
        `Splash screen meta tags are saved to index html file ${options.index}`,
      );
    } else {
      logger.warn(
        'Index html file is not specified, printing out the content to console instead',
      );
      logger.success(
        'Below is the splash screen content for your index.html file. You can copy/paste it manually',
      );
      process.stdout.write(`\n${htmlContent}\n`);
    }
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();
