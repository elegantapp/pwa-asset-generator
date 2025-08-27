import os from 'node:os';
import constants from '../config/constants.js';
import type { CLIOptions, Options } from '../models/options.js';
import type { LoggerFunction } from '../models/logger.js';

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

  return Object.keys(flags).reduce(
    (acc, curr) => {
      const flagKey = curr as keyof Options;

      if (flags[flagKey].hasOwnProperty('default')) {
        const val = flags[flagKey].default;

        if (val) {
          acc[flagKey] = val;
        }
      }

      return acc;
    },
    {} as Record<keyof Options, Options[keyof Options]>,
  ) as Options;
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
