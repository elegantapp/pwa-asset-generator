import { vi } from 'vitest';

// Set a longer timeout for tests
const TEST_TIMEOUT_IN_MILLIS = 120000;

import { beforeAll } from 'vitest';

// Chromium refuses to launch as root without --no-sandbox. CI only sets
// PAG_USE_NO_SANDBOX for Linux runners, but any environment running the
// tests as root (e.g. containers) hits the same restriction.
if (
  !process.env.PAG_USE_NO_SANDBOX &&
  process.platform !== 'win32' &&
  process.getuid?.() === 0
) {
  process.env.PAG_USE_NO_SANDBOX = '1';
}

beforeAll(() => {
  setTimeout.clear = vi.clearAllTimers;
}, TEST_TIMEOUT_IN_MILLIS);
