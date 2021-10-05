import fs from 'fs';
import path from 'path';
import slash from 'slash';
import { lookup } from 'mime-types';
import { promisify } from 'util';
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
  maskable: boolean,
  isMaskableIcon: boolean,
): string => {
  const getMaskablePrefix = (): '.maskable' | '' => {
    if (!isMaskableIcon) {
      return '';
    }
    if (maskable) {
      return '.maskable';
    }
    return '';
  };
  return convertBackslashPathToSlashPath(
    path.join(outputFolder, `${imageName}${getMaskablePrefix()}.${ext}`),
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
  return `data:${lookup(imagePath)};base64,${fs.readFileSync(imagePath, {
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

const isPathAccessible = (
  filePath: string,
  mode?: number | undefined,
): Promise<boolean> => promisify(fs.access)(filePath, mode).then(() => true);

const makeDirRecursiveSync = (dirPath: string): string => {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
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
  isPathAccessible,
  getRelativeFilePath,
  getAppDir,
  getExtension,
  getFilesInDir: promisify(fs.readdir),
  readFile: promisify(fs.readFile),
  readFileSync: fs.readFileSync,
  writeFile: promisify(fs.writeFile),
  makeDir: promisify(fs.mkdir),
  exists: promisify(fs.exists),
  makeDirRecursiveSync,
  READ_ACCESS: fs.constants.R_OK,
  WRITE_ACCESS: fs.constants.W_OK,
};
