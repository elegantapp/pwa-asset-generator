const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fileUrl = require('file-url');
const constants = require('../config/constants');

const getExtension = file => {
  return path.extname(file).replace('.', '');
};

const isImageFile = file => {
  return [
    'apng',
    'bmp',
    'gif',
    'ico',
    'cur',
    'jpg',
    'jpeg',
    'jfif',
    'pjpeg',
    'pjp',
    'png',
    'svg',
    'webp',
  ].includes(getExtension(file));
};

const isHtmlFile = file => {
  return ['html', 'htm'].includes(getExtension(file));
};

const getAppDir = () => {
  return path.dirname(require.main.filename);
};

const getShellHtmlFilePath = () => {
  return `${getAppDir()}/static/shell.html`;
};

const getDefaultImageSavePath = (imageName, ext) => {
  return path.join(process.cwd(), `${imageName}.${ext}`);
};

const getImageSavePath = (imageName, outputFolder, ext) => {
  return path.join(outputFolder, `${imageName}.${ext}`);
};

const getFileUrlOfPath = source => {
  return fileUrl(source);
};

const pathExists = (filePath, mode) => {
  return new Promise((resolve, reject) => {
    try {
      fs.access(filePath, mode, err => {
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

const makeDir = folderPath => {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

const readFile = (filePath, options) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, options, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
};

const writeFile = (filePath, data, options) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, options, err => {
      if (err) {
        return reject();
      }
      return resolve();
    });
  });
};

const addHashPostfixToImages = savedImages => {
  return Promise.all(
    savedImages.map(image => {
      return new Promise((resolve, reject) => {
        const splitPath = image.path.split('.');
        fs.createReadStream(image.path)
          .pipe(crypto.createHash('sha1').setEncoding('hex'))
          .on('finish', () => {
            const hash = this.read();
            fs.rename(
              image.path,
              `${splitPath[0]}.${hash}.${splitPath[1]}`,
              resolve,
            );
          })
          .on('error', reject);
      });
    }),
  );
};

const saveHtmlShell = (imagePath, options, isUrl) => {
  const imageUrl = isUrl ? imagePath : getFileUrlOfPath(imagePath);
  const htmlContent = constants.SHELL_HTML_FOR_LOGO(
    imageUrl,
    options.background,
    options.padding,
  );

  return writeFile(getShellHtmlFilePath(), htmlContent);
};

module.exports = {
  addHashPostfixToImages,
  saveHtmlShell,
  isHtmlFile,
  isImageFile,
  getShellHtmlFilePath,
  getImageSavePath,
  getDefaultImageSavePath,
  getFileUrlOfPath,
  pathExists,
  getAppDir,
  getExtension,
  readFile,
  writeFile,
  makeDir,
  READ_ACCESS: fs.constants.R_OK,
  WRITE_ACCESS: fs.constants.W_OK,
};
