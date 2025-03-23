import { describe, it, expect } from 'vitest';
import url from './url.js';

const exampleUrl =
  'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png';

describe('URL helper', () => {
  describe('with isUrlExist should check url existence', () => {
    it('when URL is reachable', async () => {
      expect(await url.isUrlExists(exampleUrl)).toBeTruthy();
    });

    it('when URL is not reachable', async () => {
      expect(
        await url.isUrlExists('https://your-cdn-server.com/assets/logo.png'),
      ).toBeFalsy();
    });
  });

  describe('with isUrl should check url', () => {
    it('when URL is legitimate', async () => {
      expect(await url.isUrl(exampleUrl)).toBeTruthy();
    });

    it('when URL has file path', async () => {
      expect(await url.isUrl('./assets/img/logo.png')).toBeFalsy();
    });
  });
});
