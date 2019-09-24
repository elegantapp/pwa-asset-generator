import fs from 'fs';
import path from 'path';
import slash from 'slash';
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
  return path.join(outputFolder, `${imageName}.${ext}`);
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
  return fileUrl(source);
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
  return new Promise((resolve: Function, reject: Function): void => {
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
  return new Promise((resolve: Function, reject: Function): void => {
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
  options?: { encoding?: null; flag?: string } | undefined | null,
): Promise<string> => {
  return new Promise((resolve: Function, reject: Function): void => {
    fs.readFile(filePath, options, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
};

const writeFile = (filePath: string, data: string): Promise<void> => {
  return new Promise((resolve: Function, reject: Function): void => {
    fs.writeFile(filePath, data, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        return reject();
      }
      return resolve();
    });
  });
};

const convertBackslashPathToSlashPath = (backSlashPath: string): string => {
  return slash(backSlashPath);
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

const saveHtmlShell = (
  imagePath: string,
  options: Options,
  isUrl: boolean,
): Promise<void> => {
  const imageUrl = isUrl ? imagePath : getFileUrlOfPath(imagePath);
  const htmlContent = constants.SHELL_HTML_FOR_LOGO(
    imageUrl,
    options.background,
    options.padding,
  );

  return writeFile(getShellHtmlFilePath(), htmlContent);
};

export default {
  convertBackslashPathToSlashPath,
  getRelativeImagePath,
  saveHtmlShell,
  isHtmlFile,
  isImageFile,
  getShellHtmlFilePath,
  getImageSavePath,
  getFileUrlOfPath,
  pathExists,
  getRelativeFilePath,
  getAppDir,
  getExtension,
  readFile,
  writeFile,
  makeDir,
  READ_ACCESS: fs.constants.R_OK,
  WRITE_ACCESS: fs.constants.W_OK,
};
