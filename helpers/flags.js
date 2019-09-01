const normalizeOnlyFlagPairs = (flag1Key, flag2Key, opts, logger) => {
  const stripOnly = key => key.replace('Only', '');
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

const normalizeOutput = output => {
  if (!output) {
    return '.';
  }
  return output;
};

module.exports = {
  normalizeOnlyFlagPairs,
  normalizeOutput,
};
