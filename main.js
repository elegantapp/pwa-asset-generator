const pwa = require('./helpers/pwa');
const puppets = require('./puppets');
const flags = require('./helpers/flags');
const preLogger = require('./helpers/logger');

const generateImages = async (source, _output, _options, loggerFn) => {
  const logger = loggerFn || preLogger(generateImages.name, _options);

  if (!source) {
    throw Error('Please specify a URL or file path as a source');
  }

  const options = {
    ...flags.getDefaultOptions(),
    ..._options,
    ...flags.normalizeOnlyFlagPairs('splashOnly', 'iconOnly', _options, logger),
    ...flags.normalizeOnlyFlagPairs(
      'landscapeOnly',
      'portraitOnly',
      _options,
      logger,
    ),
  };

  const output = flags.normalizeOutput(_output);

  const savedImages = await puppets.generateImages(source, output, options);
  const manifestJsonContent = pwa.generateIconsContentForManifest(
    savedImages,
    options.manifest,
  );
  const htmlContent = pwa.generateHtmlForIndexPage(savedImages, options.index);

  if (!options.splashOnly) {
    if (options.manifest) {
      await pwa.addIconsToManifest(manifestJsonContent, options.manifest);
      logger.success(
        `Icons are saved to Web App Manifest file ${options.manifest}`,
      );
    } else if (!options.splashOnly) {
      logger.warn(
        'Web App Manifest file is not specified, printing out the content to console instead',
      );
      logger.success(
        'Below is the icons content for your manifest.json file. You can copy/paste it manually',
      );
      logger.raw(`\n${JSON.stringify(manifestJsonContent, null, 2)}\n\n`);
    }
  }

  if (options.index) {
    await pwa.addMetaTagsToIndexPage(htmlContent, options.index);
    logger.success(
      `iOS meta tags are saved to index html file ${options.index}`,
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
};

module.exports = {
  generateImages,
};
