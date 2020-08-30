const forceExit = !!process.env.FORCE_EXIT;

module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  cacheDirectory: '.jest-cache',
  forceExit,
};
