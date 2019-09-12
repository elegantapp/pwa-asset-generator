const chalk = require('chalk');

const testMode = !!+process.env.PAG_TEST_MODE;

const logger = (prefix, options) => {
  const isLogEnabled =
    options && options.hasOwnProperty('log') ? options.log : true;

  const getTime = () => {
    return chalk.inverse(new Date().toLocaleTimeString());
  };

  const getPrefix = () => {
    return prefix ? chalk.gray(prefix) : null;
  };

  /* eslint-disable no-console */
  const raw = (...args) => {
    if (!isLogEnabled) return;
    console.log(...args);
  };

  const log = (...args) => {
    if (testMode || !isLogEnabled) return;
    console.log(getTime(), getPrefix(), ...args);
  };

  const warn = (...args) => {
    if (testMode || !isLogEnabled) return;
    console.warn(getTime(), getPrefix(), chalk.yellow(...args), '🤔');
  };

  const trace = (...args) => {
    if (testMode || !isLogEnabled) return;
    console.trace(getTime(), getPrefix(), ...args);
  };

  const error = (...args) => {
    console.error(getTime(), getPrefix(), chalk.red(...args), '😭');
  };

  const success = (...args) => {
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

module.exports = logger;
