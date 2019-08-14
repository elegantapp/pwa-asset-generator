const chalk = require('chalk');

const logger = prefix => {
  const getTime = () => {
    return chalk.inverse(new Date().toLocaleTimeString());
  };

  const getPrefix = () => {
    return prefix ? chalk.gray(prefix) : null;
  };

  /* eslint-disable no-console */
  const log = (...args) => {
    console.log(getTime(), getPrefix(), ...args);
  };

  const warn = (...args) => {
    console.warn(getTime(), getPrefix(), chalk.yellow(...args), '🤔');
  };

  const trace = (...args) => {
    console.trace(getTime(), getPrefix(), ...args);
  };

  const error = (...args) => {
    console.error(getTime(), getPrefix(), chalk.red(...args), '😭');
  };

  const success = (...args) => {
    console.log(getTime(), getPrefix(), chalk.green(...args), '🙌');
  };
  /* eslint-enable no-console */

  return {
    log,
    warn,
    trace,
    error,
    success,
  };
};

module.exports = logger;
