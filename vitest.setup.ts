// Set a longer timeout for tests
const TEST_TIMEOUT_IN_MILLIS = 120000;

import { beforeAll } from 'vitest';

beforeAll(
  () => {
    setTimeout.clear = vi.clearAllTimers;
  },
  { timeout: TEST_TIMEOUT_IN_MILLIS },
);
