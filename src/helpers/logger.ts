import chalk from 'chalk';
import { Logger } from '../models/logger';
import { CLIOptions } from '../models/options';

const testMode = !!+(process.env.PAG_TEST_MODE as string);

const logger: Logger = (prefix: string, options?: CLIOptions) => {
  const isLogEnabled =
    options && options.hasOwnProperty('log') ? options.log : true;

  const getTime = (): string => {
    return chalk.inverse(new Date().toLocaleTimeString());
  };

  const getPrefix = (): string => {
    return prefix ? chalk.gray(prefix) : '';
  };

  /* eslint-disable no-console */
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
    console.warn(getTime(), getPrefix(), chalk.yellow(...args), '🤔');
  };

  const trace = (...args: string[]): void => {
    if (testMode || !isLogEnabled) return;
    console.trace(getTime(), getPrefix(), ...args);
  };

  const error = (...args: string[]): void => {
    console.error(getTime(), getPrefix(), chalk.red(...args), '😭');
  };

  const success = (...args: string[]): void => {
    if (testMode || !isLogEnabled) return;
    console.log(getTime(), getPrefix(), chalk.green(...args), '🙌');
  };
  /* eslint-enable no-console */

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
