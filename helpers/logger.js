const chalk = require('chalk');

const noTrace = !!+process.env.PAG_NO_TRACE;

const logger = prefix => {
  const getTime = () => {
    return chalk.inverse(new Date().toLocaleTimeString());
  };

  const getPrefix = () => {
    return prefix ? chalk.gray(prefix) : null;
  };

  /* eslint-disable no-console */
  const log = (...args) => {
    if (noTrace) return;
    console.log(getTime(), getPrefix(), ...args);
  };

  const warn = (...args) => {
    if (noTrace) return;
    console.warn(getTime(), getPrefix(), chalk.yellow(...args), '🤔');
  };

  const trace = (...args) => {
    if (noTrace) return;
    console.trace(getTime(), getPrefix(), ...args);
  };

  const error = (...args) => {
    console.error(getTime(), getPrefix(), chalk.red(...args), '😭');
  };

  const success = (...args) => {
    if (noTrace) return;
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
