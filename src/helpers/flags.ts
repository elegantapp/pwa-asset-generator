import os from 'os';
import constants from '../config/constants';
import { CLIOptions, Options } from '../models/options';
import { LoggerFunction } from '../models/logger';

const normalizeOnlyFlagPairs = (
  flag1Key: keyof Options,
  flag2Key: keyof Options,
  opts: CLIOptions,
  logger: LoggerFunction,
): Partial<Options> => {
  const stripOnly = (key: string): string => key.replace('Only', '');
  if (opts[flag1Key] && opts[flag2Key]) {
    logger.warn(
      `Hmm, you want to _only_ generate both ${stripOnly(
        flag1Key,
      )} and ${stripOnly(
        flag2Key,
      )} set. Ignoring --x-only settings as this is default behavior`,
    );
    return {
      [flag1Key]: false,
      [flag2Key]: false,
    };
  }
  return {};
};

const normalizeOutput = (output: string): string => {
  if (!output) {
    return '.';
  }
  return output;
};

const getDefaultOptions = (): Options => {
  const flags = constants.FLAGS as Record<
    keyof Options,
    { type: string; alias: string; default?: string | number | boolean }
  >;

  // TODO: replace Object.keys typecasting when it can be derived as a type
  // https://github.com/microsoft/TypeScript/pull/12253#issuecomment-263132208
  return Object.keys(flags)
    .filter((flagKey) =>
      flags[flagKey as keyof Options].hasOwnProperty('default'),
    )
    .reduce((acc: Options, curr: string | keyof Options) => {
      return {
        ...acc,
        [curr]: flags[curr as keyof Options].default,
      };
    }, {} as Options);
};

const normalizeSandboxOption = (
  noSandbox: boolean | undefined,
  logger: LoggerFunction,
): Partial<Options> => {
  let sandboxDisabled = false;
  if (noSandbox) {
    if (os.platform() !== 'linux') {
      logger.warn(
        'Disabling sandbox is only relevant on Linux platforms, request declined!',
      );
    } else {
      sandboxDisabled = true;
    }
  }
  return {
    noSandbox: sandboxDisabled,
  };
};

export default {
  normalizeOnlyFlagPairs,
  normalizeOutput,
  getDefaultOptions,
  normalizeSandboxOption,
};
