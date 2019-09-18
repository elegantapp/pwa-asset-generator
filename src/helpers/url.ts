import url from 'url';
import dns from 'dns';
import file from './file';
import preLogger from './logger';

const isUrl = val => {
  const parsedUrl = url.parse(val);
  return ['http:', 'https:'].includes(parsedUrl.protocol);
};

// TODO: Find a better way to check url existence
const isUrlExists = source => {
  return new Promise((resolve, reject) => {
    try {
      dns.resolve(url.parse(source).hostname, err => {
        if (err) {
          return resolve(false);
        }
        return resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAddress = async (source, options) => {
  const logger = preLogger(getAddress.name, options);

  const useShell = async (isSourceUrl = false) => {
    try {
      await file.saveHtmlShell(source, options, isSourceUrl);
    } catch (e) {
      logger.error(e);
      throw Error('Failed saving html shell');
    }

    logger.log('Providing shell html path as navigation address');
    return file.getFileUrlOfPath(file.getShellHtmlFilePath());
  };

  if (isUrl(source)) {
    if (!(await isUrlExists(source))) {
      throw Error(
        `Cannot resolve ${source}. Please check your internet connection`,
      );
    }

    if (file.isImageFile(source)) {
      logger.log('Saving html shell with provided image url');
      return useShell(true);
    }

    logger.log('Providing url source as navigation address');
    return source;
  }

  if (!(await file.pathExists(source, file.READ_ACCESS))) {
    throw Error(`Cannot find path ${source}. Please check if file exists`);
  }

  if (file.isImageFile(source)) {
    logger.log('Saving html shell with provided image source');
    return useShell();
  }

  if (file.isHtmlFile(source)) {
    logger.log('Providing html file path as navigation address');
    return file.getFileUrlOfPath(source);
  }

  return source;
};

export default { isUrl, isUrlExists, getAddress };
