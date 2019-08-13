'use strict';

const url = require('url');
const dns = require('dns');
const file = require('./file');
const preLogger = require('./logger');

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
  const logger = preLogger(getAddress.name);

  const useShell = async (isUrl = false) => {
    try {
      await file.saveHtmlShell(source, options, isUrl);
    } catch (e) {
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
      return await useShell(true);
    }

    logger.log('Providing url source as navigation address');
    return source;
  }

  if (!(await file.pathExists(source, file.READ_ACCESS))) {
    throw Error(`Cannot find path ${source}. Please check if file exists`);
  }

  if (file.isImageFile(source)) {
    logger.log('Saving html shell with provided image source');
    return await useShell();
  }

  if (file.isHtmlFile(source)) {
    logger.log('Providing html file path as navigation address');
    return file.getFileUrlOfPath(source);
  }
};

module.exports = {
  isUrl,
  isUrlExists,
  getAddress,
};
