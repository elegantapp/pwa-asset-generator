import { describe, test, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import meta from './meta.js';
import { HTMLMetaNames } from '../models/meta.js';
import type { HTMLMeta } from '../models/meta.js';

const EMPTY_HTML_META: HTMLMeta = {
  [HTMLMetaNames.appleMobileWebAppCapable]: '',
};

const makeTempIndexHtml = async (content: string): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pag-meta-test-'));
  const indexHtmlPath = path.join(dir, 'index.html');
  await fs.writeFile(indexHtmlPath, content);
  return indexHtmlPath;
};

describe('meta helper', () => {
  describe('with addMetaTagsToIndexPage', () => {
    test('rejects and leaves the file unchanged when index html has no <head> element', async () => {
      // htmlparser2's xml mode does no tree correction, so a fragment with
      // no <head> stays that way instead of having one synthesized, unlike
      // parse5's full HTML5 parsing algorithm would (used when xhtml is false).
      const originalContent = '<div>no head here</div>';
      const indexHtmlPath = await makeTempIndexHtml(originalContent);

      await expect(
        meta.addMetaTagsToIndexPage(EMPTY_HTML_META, indexHtmlPath, true),
      ).rejects.toThrow(
        `Cannot find <head> element in index html file ${indexHtmlPath}`,
      );

      expect(await fs.readFile(indexHtmlPath, 'utf8')).toBe(originalContent);
    });

    test('inserts meta tags into an existing <head> element', async () => {
      const indexHtmlPath = await makeTempIndexHtml(
        '<html><head></head><body></body></html>',
      );

      await meta.addMetaTagsToIndexPage(
        {
          [HTMLMetaNames.appleMobileWebAppCapable]:
            '<meta name="apple-mobile-web-app-capable" content="yes">\n',
        },
        indexHtmlPath,
        false,
      );

      const updatedContent = await fs.readFile(indexHtmlPath, 'utf8');
      expect(updatedContent).toContain(
        '<meta name="apple-mobile-web-app-capable" content="yes">',
      );
    });
  });
});
