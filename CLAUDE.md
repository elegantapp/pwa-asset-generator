# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pwa-asset-generator is a CLI tool and JavaScript module that automates PWA asset generation. It generates icon and splash screen images for Progressive Web Apps, automatically updating manifest.json and index.html files according to Web App Manifest specs and Apple Human Interface guidelines.

The tool uses Puppeteer to control a Chrome browser as a canvas, rendering images at various resolutions for different devices. It can scrape Apple's Human Interface guidelines website to get the latest device specifications or fall back to static data.

## Essential Commands

### Development workflow
```bash
npm install              # Install dependencies
npm run build            # Build TypeScript to dist/ (also copies JSON files)
npm run start            # Watch mode for TypeScript compilation
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run prettier         # Check code formatting
npm run prettier:fix     # Auto-format code
npm run tsc              # Type check without emitting files
```

### Testing
```bash
npm test                                  # Run all tests with Vitest
npm run test:update                       # Update all snapshots (visual + regular)
npm run test:update:snapshots             # Update regular snapshots only
npm run test:update:visuals               # Update all visual test snapshots
npm run chromium                          # Install Chromium (required for tests)
npm run test:concurrency                  # Concurrency stress test (see below)
```

Note: Visual tests generate actual images in `src/__snapshots__/visual/` and compare them. When updating visual tests, ensure you're not accidentally breaking existing behavior.

### Concurrency stress test

`scripts/concurrency-stress-test.mjs` exercises the `saveImages` worker pool with 400+ images across simulated hardware profiles. It prints the computed concurrency for every profile, then runs a real end-to-end test.

```bash
# Run against real hardware (auto-detected CPU count and free memory)
npm run test:concurrency

# Simulate a specific hardware profile via env vars
PAG_SIMULATE_CPU_COUNT=1 PAG_SIMULATE_FREE_MEM_MB=512 npm run test:concurrency
PAG_SIMULATE_CPU_COUNT=2 PAG_SIMULATE_FREE_MEM_MB=2048 npm run test:concurrency
```

`PAG_SIMULATE_CPU_COUNT` and `PAG_SIMULATE_FREE_MEM_MB` override the values that `getOptimalConcurrency` reads from `os.cpus()` and `os.freemem()`, letting you reproduce any hardware scenario locally without Docker.

### Running the CLI locally
```bash
npm run build                             # Build first
node bin/cli.js <source> <output>         # Run CLI directly
# Or install globally for testing:
npm i . -g
pwa-asset-generator <source> <output>
```

### Updating fallback data
```bash
npm run update           # Scrape Apple HIG and update apple-fallback-data.json
```

This scrapes the latest device specs from Apple's website and updates `src/config/apple-fallback-data.json`.

## Architecture

### Core flow
1. **CLI Entry** (`src/cli.ts`): Parses arguments using meow, validates flags
2. **Main Function** (`src/main.ts`): Orchestrates the generation process via `generateImages()`
3. **Image Generation** (`src/helpers/puppets.ts`): Controls Puppeteer to generate images
4. **Meta Generation** (`src/helpers/meta.ts`): Generates HTML meta tags and manifest.json content
5. **File Operations** (`src/helpers/file.ts`): Handles file I/O and path resolution

### Key components

**Puppets helper** (`src/helpers/puppets.ts`):
- Launches Puppeteer browser
- Scrapes Apple HIG website for device specs (or uses fallback data)
- Creates a shell HTML page as an "art board" for image rendering
- Takes screenshots at various resolutions
- Generates icons (manifest, apple-touch, favicon, mstile) and splash screens

**Meta helper** (`src/helpers/meta.ts`):
- Generates HTML meta tags for iOS splash screens and icons
- Generates manifest.json icon entries
- Updates existing manifest.json and index.html files using Cheerio
- Formats output using the `pretty` library

**Browser helper** (`src/helpers/browser.ts`):
- Manages Puppeteer browser lifecycle
- Handles chromium installation check
- Uses puppeteer-core to avoid bundling Chromium

**Flag/Options handling** (`src/helpers/flags.ts`):
- Normalizes CLI flags into internal options
- Handles mutually exclusive flag pairs (e.g., `splashOnly`/`iconOnly`)
- Validates sandbox options

### File structure
```
src/
├── cli.ts                    # CLI entry point
├── main.ts                   # Main generateImages() function
├── config/
│   ├── constants.ts          # All constants, flag definitions
│   └── apple-fallback-data.json  # Static device specs
├── models/                   # TypeScript type definitions
│   ├── image.ts
│   ├── meta.ts
│   ├── options.ts
│   ├── result.ts
│   ├── spec.ts
│   └── logger.ts
└── helpers/                  # Core logic modules
    ├── puppets.ts           # Puppeteer orchestration
    ├── meta.ts              # HTML/manifest generation
    ├── browser.ts           # Browser management
    ├── file.ts              # File operations
    ├── url.ts               # URL handling
    ├── images.ts            # Image specification generation
    ├── installer.ts         # Chromium installation
    ├── logger.ts            # Logging utilities
    └── flags.ts             # Flag normalization
```

### Important design decisions

**Scraping vs static data**: The tool attempts to scrape Apple's HIG website to get the latest device specs. If scraping fails or is disabled (`--scrape false`), it falls back to static JSON data in `src/config/apple-fallback-data.json`.

**Puppeteer-core**: Uses `puppeteer-core` instead of full `puppeteer` to avoid bundling Chromium (~110-150MB). Chromium is installed separately via `bin/install.js` only when needed.

**HTML as input**: Users can provide HTML files (not just images) as input, allowing creative splash screens with CSS, gradients, SVG filters, media queries, etc. The HTML is rendered in Chrome before taking screenshots.

**Path handling**: The tool supports various path configurations:
- `--path`: Prefix for meta tag paths (e.g., `%PUBLIC_URL%` for React)
- `--path-override`: Override the entire path
- Automatic relative path calculation between manifest/index and images

**Sandbox option**: On Linux CI servers, `--no-sandbox` disables Chromium sandboxing to avoid "No usable sandbox!" errors. HTML inputs are disabled when sandbox is off for security.

## Testing Strategy

Tests use Vitest with a 120-second timeout (Puppeteer operations can be slow).

**Visual regression tests**: The test suite includes visual tests that generate actual images and compare them pixel-by-pixel using snapshots. These are in `src/__snapshots__/visual/`.

**Test environment variables**:
- `PAG_TEST_MODE=1`: Enables test mode
- `PAG_USE_LOCAL_REV=1`: Uses local build instead of published package
- `PAG_USE_NO_SANDBOX=1`: Disables sandbox on Linux

## Module API

The package exports both a CLI and a JavaScript module. Users can import `generateImages()` function:

```javascript
import { generateImages, appleDeviceSpecsForLaunchImages } from 'pwa-asset-generator';

const { savedImages, htmlMeta, manifestJsonContent } = await generateImages(
  'logo.svg',
  './output',
  { scrape: false, background: 'coral', splashOnly: true }
);
```

## Release Process

This project uses semantic-release with conventional commits:
- Commits must follow conventional commit format
- `commitlint` enforces commit message format
- CI runs on push and PR
- Releases are automated on master branch
- CHANGELOG.md is automatically generated