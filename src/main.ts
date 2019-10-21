import pwa from './helpers/pwa';
import puppets from './helpers/puppets';
import flags from './helpers/flags';
import preLogger from './helpers/logger';
import { CLIOptions, Options } from './models/options';
import { Result } from './models/result';
import { LoggerFunction } from './models/logger';

/**
 Generates PWA assets based on a source input and saves generated images in the output folder provided

 @param source - A local image file, a local HTML file, a remote image or remote HTML file path
 @param outputFolderPath - The path of the folder to save the images in
 @param options - Option flags of the library in an object, keeps default values
 @param loggerFn - An optional logger function to log the output
 @returns A promise of result object that resolves when all images are generated and file updates are finalized

 @example
 ```javascript
 import pwaAssetGenerator = require('pwa-asset-generator');

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
 */
async function generateImages(
  source: string,
  outputFolderPath: string,
  options?: CLIOptions,
  loggerFn?: LoggerFunction,
): Promise<Result> {
  let modOptions: Options;
  const logger = loggerFn || preLogger(generateImages.name, options);

  if (!source) {
    throw Error('Please specify a URL or file path as a source');
  }

  if (options) {
    modOptions = {
      ...flags.getDefaultOptions(),
      ...options,
      ...flags.normalizeOnlyFlagPairs(
        'splashOnly',
        'iconOnly',
        options,
        logger,
      ),
      ...flags.normalizeOnlyFlagPairs(
        'landscapeOnly',
        'portraitOnly',
        options,
        logger,
      ),
    };
  } else {
    modOptions = {
      ...flags.getDefaultOptions(),
    };
  }

  const output = flags.normalizeOutput(outputFolderPath);

  const savedImages = await puppets.generateImages(source, output, modOptions);
  const manifestJsonContent = pwa.generateIconsContentForManifest(
    savedImages,
    modOptions.manifest,
  );
  const htmlContent = pwa.generateHtmlForIndexPage(
    savedImages,
    modOptions.index,
    modOptions.path,
    modOptions.singleQuotes,
  );

  if (!modOptions.splashOnly) {
    if (modOptions.manifest) {
      await pwa.addIconsToManifest(manifestJsonContent, modOptions.manifest);
      logger.success(
        `Icons are saved to Web App Manifest file ${modOptions.manifest}`,
      );
    } else if (!modOptions.splashOnly) {
      logger.warn(
        'Web App Manifest file is not specified, printing out the content to console instead',
      );
      logger.success(
        'Below is the icons content for your manifest.json file. You can copy/paste it manually',
      );
      logger.raw(`\n${JSON.stringify(manifestJsonContent, null, 2)}\n\n`);
    }
  }

  if (modOptions.index) {
    await pwa.addMetaTagsToIndexPage(htmlContent, modOptions.index);
    logger.success(
      `iOS meta tags are saved to index html file ${modOptions.index}`,
    );
  } else {
    logger.warn(
      'Index html file is not specified, printing out the content to console instead',
    );
    logger.success(
      'Below is the iOS meta tags content for your index.html file. You can copy/paste it manually',
    );
    logger.raw(`\n${htmlContent}\n`);
  }

  return { savedImages, htmlContent, manifestJsonContent };
}

export { generateImages };
