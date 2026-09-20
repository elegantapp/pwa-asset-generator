import path from 'node:path';
import fs from 'node:fs';
import meta from './meta.js';
import { HTMLMetaNames } from '../models/meta.js';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import type { HTMLMeta } from '../models/meta.js';

describe('addMetaTagsToIndexPage', () => {
  const indexHtmlFilePath = path.join('./temp', 'meta-no-head-index.html');

  const htmlMeta: HTMLMeta = {
    [HTMLMetaNames.favicon]:
      '<link rel="icon" type="image/png" sizes="32x32" href="favicon.png">',
    [HTMLMetaNames.appleMobileWebAppCapable]:
      '<meta name="apple-mobile-web-app-capable" content="yes">',
  };

  beforeEach(() => {
    fs.mkdirSync('./temp', { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(indexHtmlFilePath, { force: true });
  });

  test('leaves an xhtml index.html without a <head> element untouched', async () => {
    // In (non-xhtml) HTML mode, the parser reconstructs an implied <head> per
    // the HTML5 tree-construction algorithm, so a missing <head> only
    // survives parsing in xhtml mode, which parses literally.
    const bodyOnlyHtml = '<html><body><h1>No head here</h1></body></html>';
    fs.writeFileSync(indexHtmlFilePath, bodyOnlyHtml);

    await meta.addMetaTagsToIndexPage(htmlMeta, indexHtmlFilePath, true);

    const savedIndex = fs.readFileSync(indexHtmlFilePath, {
      encoding: 'utf8',
    });

    expect(savedIndex).not.toContain(htmlMeta[HTMLMetaNames.favicon]);
    expect(savedIndex).not.toContain(
      htmlMeta[HTMLMetaNames.appleMobileWebAppCapable],
    );
    expect(savedIndex).toContain('No head here');
  });
});
