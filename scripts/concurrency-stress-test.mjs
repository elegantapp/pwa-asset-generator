/**
 * Concurrency stress test for the saveImages worker pool (issue #1268).
 *
 * Inflates the image list to 100+ entries and runs under simulated hardware
 * profiles using PAG_SIMULATE_CPU_COUNT and PAG_SIMULATE_FREE_MEM_MB env vars.
 *
 * Usage:
 *   npm run test:concurrency                                                         # real hardware
 *   PAG_SIMULATE_CPU_COUNT=1 PAG_SIMULATE_FREE_MEM_MB=256 npm run test:concurrency   # constrained
 */

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

const { default: browserHelper } = await import(
  `${distDir}/helpers/browser.js`
);
const { default: puppets } = await import(`${distDir}/helpers/puppets.js`);
const { default: constants } = await import(`${distDir}/config/constants.js`);

const source = path.resolve(__dirname, '..', 'static', 'logo.svg');

// Build a large image list by duplicating real splash screen entries
const splashData = constants.APPLE_HIG_SPLASH_SCREEN_FALLBACK_DATA;

const baseImages = splashData.flatMap((spec) => [
  {
    name: `apple-splash-${spec.portrait.width}-${spec.portrait.height}`,
    width: spec.portrait.width,
    height: spec.portrait.height,
    scaleFactor: spec.scaleFactor,
    orientation: 'portrait',
  },
  {
    name: `apple-splash-${spec.landscape.width}-${spec.landscape.height}`,
    width: spec.landscape.width,
    height: spec.landscape.height,
    scaleFactor: spec.scaleFactor,
    orientation: 'landscape',
  },
]);

// Inflate to ~100 entries by duplicating with unique names
const inflatedImages = Array.from({ length: 4 }, (_, round) =>
  baseImages.map((img) => ({ ...img, name: `${img.name}-r${round}` })),
).flat();

const options = {
  scrape: false,
  type: 'jpg',
  quality: 70,
  opaque: true,
  background: 'coral',
  padding: '10%',
  maskable: true,
  darkMode: false,
  noSandbox: false,
  log: false,
};

// Hardware profiles to simulate. Each overrides PAG_SIMULATE_* env vars.
const profiles = [
  {
    label: 'Real hardware',
    cpus: os.cpus().length,
    freeMb: Math.round(os.freemem() / 1024 / 1024),
  },
  { label: 'High-end server (32c/32GB)', cpus: 32, freeMb: 32768 },
  { label: 'Typical dev (8c/8GB)', cpus: 8, freeMb: 8192 },
  { label: 'Low-end CI (2c/2GB)', cpus: 2, freeMb: 2048 },
  { label: 'Constrained Docker (1c/512MB)', cpus: 1, freeMb: 512 },
  { label: 'Worst case (1c/256MB)', cpus: 1, freeMb: 256 },
];

const MEMORY_PER_CONTEXT_MB = 150;
const simulateConcurrency = (cpus, freeMb, imageCount) => {
  const memoryBasedLimit = Math.floor((freeMb * 0.8) / MEMORY_PER_CONTEXT_MB);
  return Math.min(Math.max(1, Math.min(cpus, memoryBasedLimit)), imageCount);
};

console.log(`\nImage list size: ${inflatedImages.length}\n`);
console.log('Simulated concurrency across hardware profiles:');
console.log('─'.repeat(60));
for (const { label, cpus, freeMb } of profiles) {
  const c = simulateConcurrency(cpus, freeMb, inflatedImages.length);
  console.log(
    `  ${label.padEnd(34)} → ${c} worker(s)  (${cpus} CPUs, ${freeMb}MB free)`,
  );
}
console.log('─'.repeat(60));

// Run a real end-to-end test using the current machine's resources
const simulatedCpus =
  Number(process.env.PAG_SIMULATE_CPU_COUNT) || os.cpus().length;
const simulatedFreeMb =
  Number(process.env.PAG_SIMULATE_FREE_MEM_MB) ||
  Math.round(os.freemem() / 1024 / 1024);
const expectedConcurrency = simulateConcurrency(
  simulatedCpus,
  simulatedFreeMb,
  inflatedImages.length,
);

console.log(
  `\nRunning end-to-end with: ${simulatedCpus} CPUs, ${simulatedFreeMb}MB free → ${expectedConcurrency} worker(s)`,
);

const output = fs.mkdtempSync(path.join(os.tmpdir(), 'pag-repro-'));
const { browser, chrome } = await browserHelper.getBrowserInstance(
  { timeout: constants.BROWSER_TIMEOUT, args: constants.CHROME_LAUNCH_ARGS },
  false,
);

try {
  process.env.PAG_SIMULATE_CPU_COUNT = String(simulatedCpus);
  process.env.PAG_SIMULATE_FREE_MEM_MB = String(simulatedFreeMb);
  await puppets.saveImages(inflatedImages, source, output, options, browser);
  console.log(`✅ Completed ${inflatedImages.length} images without errors.`);
} catch (e) {
  console.error(`❌ Error: ${e.message}`);
} finally {
  await browserHelper.killBrowser(browser, chrome).catch(() => {});
  fs.rmSync(output, { recursive: true, force: true });
}
