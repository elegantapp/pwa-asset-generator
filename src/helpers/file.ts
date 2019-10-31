import fs from 'fs';
import path from 'path';
import slash from 'slash';
import { lookup } from 'mime-types';
import constants from '../config/constants';
import { Extension, Options } from '../models/options';

const getExtension = (file: string): string => {
  return path.extname(file).replace('.', '');
};

const isImageFile = (file: string): boolean => {
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

const isHtmlFile = (file: string): boolean => {
  return ['html', 'htm'].includes(getExtension(file));
};

const convertBackslashPathToSlashPath = (backSlashPath: string): string => {
  return slash(backSlashPath);
};

const getAppDir = (): string => {
  let appPath;
  try {
    appPath = require.resolve('pwa-asset-generator');
  } catch (e) {
    appPath = (require.main as NodeModule).filename;
  }
  return path.join(path.dirname(appPath), '..');
};

const getShellHtmlFilePath = (): string => {
  return `${getAppDir()}/static/shell.html`;
};

const getImageSavePath = (
  imageName: string,
  outputFolder: string,
  ext: Extension,
): string => {
  return convertBackslashPathToSlashPath(
    path.join(outputFolder, `${imageName}.${ext}`),
  );
};

const fileUrl = (filePath: string): string => {
  let pathName = filePath;
  pathName = pathName.replace(/\\/g, '/');

  // Windows drive letter must be prefixed with a slash
  if (pathName[0] !== '/') {
    pathName = `/${pathName}`;
  }

  return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
};

const getFileUrlOfPath = (source: string): string => {
  return fileUrl(path.resolve(source));
};

const getRelativeFilePath = (
  referenceFilePath: string,
  filePath: string,
): string => {
  return path.relative(
    path.dirname(path.resolve(referenceFilePath)),
    path.resolve(filePath),
  );
};

const pathExists = (
  filePath: string,
  mode?: number | undefined,
): Promise<boolean> => {
  return new Promise((resolve, reject): void => {
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

const makeDir = (folderPath: string): Promise<string> => {
  return new Promise((resolve, reject): void => {
    fs.mkdir(folderPath, { recursive: true }, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

const readFile = (
  filePath: string,
  options?: { encoding?: 'base64' | null; flag?: string } | undefined | null,
): Promise<Buffer | string> => {
  return new Promise((resolve, reject): void => {
    fs.readFile(filePath, options, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
};

const readFileSync = (
  filePath: string,
  options?: { encoding?: 'base64' | null; flag?: string } | undefined | null,
): string => {
  return fs.readFileSync(filePath, options) as string;
};

const writeFile = (filePath: string, data: string): Promise<void> => {
  return new Promise((resolve, reject): void => {
    fs.writeFile(filePath, data, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        return reject();
      }
      return resolve();
    });
  });
};

const getRelativeImagePath = (
  outputFilePath: string,
  imagePath: string,
): string => {
  if (outputFilePath) {
    return convertBackslashPathToSlashPath(
      getRelativeFilePath(outputFilePath, imagePath),
    );
  }
  return convertBackslashPathToSlashPath(imagePath);
};

const getImageBase64Url = (imagePath: string): string => {
  return `data:${lookup(imagePath)};base64,${readFileSync(imagePath, {
    encoding: 'base64',
  })}`;
};

const getHtmlShell = (
  imagePath: string,
  options: Options,
  isUrl: boolean,
): string => {
  const imageUrl = isUrl ? imagePath : getImageBase64Url(imagePath);

  return `${constants.SHELL_HTML_FOR_LOGO(
    imageUrl,
    options.background,
    options.padding,
  )}`;
};

export default {
  convertBackslashPathToSlashPath,
  getRelativeImagePath,
  getHtmlShell,
  isHtmlFile,
  isImageFile,
  getImageBase64Url,
  getShellHtmlFilePath,
  getImageSavePath,
  getFileUrlOfPath,
  pathExists,
  getRelativeFilePath,
  getAppDir,
  getExtension,
  readFile,
  readFileSync,
  writeFile,
  makeDir,
  READ_ACCESS: fs.constants.R_OK,
  WRITE_ACCESS: fs.constants.W_OK,
};
