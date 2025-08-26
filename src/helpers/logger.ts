import pc from 'picocolors';
import type { Logger } from '../models/logger.js';
import type { CLIOptions } from '../models/options.js';

const testMode = !!+(process.env.PAG_TEST_MODE as string);

const logger: Logger = (prefix: string, options?: CLIOptions) => {
  const isLogEnabled =
    options && options.hasOwnProperty('log') ? options.log : true;

  const getTime = (): string => pc.inverse(new Date().toLocaleTimeString());

  const getPrefix = (): string => (prefix ? pc.gray(prefix) : '');

  const raw = (...args: string[]): void => {
    if (!isLogEnabled) return;
    console.log(...args);
  };

  const log = (...args: string[]): void => {
    if (testMode || !isLogEnabled) return;
    console.log(getTime(), getPrefix(), ...args);
  };

  const warn = (...args: string[]): void => {
    if (testMode || !isLogEnabled) return;
    console.warn(
      getTime(),
      getPrefix(),
      args.map((arg) => pc.yellow(arg)),
      '🤔',
    );
  };

  const trace = (...args: string[]): void => {
    if (testMode || !isLogEnabled) return;
    console.trace(getTime(), getPrefix(), ...args);
  };

  const error = (...args: string[]): void => {
    console.error(
      getTime(),
      getPrefix(),
      args.map((arg) => pc.red(arg)),
      '😭',
    );
  };

  const success = (...args: string[]): void => {
    if (testMode || !isLogEnabled) return;
    console.log(
      getTime(),
      getPrefix(),
      args.map((arg) => pc.green(arg)),
      '🙌',
    );
  };

  return {
    raw,
    log,
    warn,
    trace,
    error,
    success,
  };
};

export default logger;
