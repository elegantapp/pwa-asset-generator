import chalk from 'chalk';
import { Logger } from '../models/logger.js';
import { CLIOptions } from '../models/options.js';

const testMode = !!+(process.env.PAG_TEST_MODE as string);

const logger: Logger = (prefix: string, options?: CLIOptions) => {
  const isLogEnabled =
    options && options.hasOwnProperty('log') ? options.log : true;

  const getTime = (): string => chalk.inverse(new Date().toLocaleTimeString());

  const getPrefix = (): string => (prefix ? chalk.gray(prefix) : '');

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
