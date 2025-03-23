import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
    testTimeout: 120000,
  },
});
