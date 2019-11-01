import url from './url';

const exampleUrl =
  'https://raw.githubusercontent.com/onderceylan/pwa-asset-generator/HEAD/static/logo.png';

describe('URL helper', () => {
  describe('with isUrl should check url', () => {
    it('when URL is legitimate', async () => {
      expect(await url.isUrl(exampleUrl)).toBeTruthy();
    });

    it('when URL has file path', async () => {
      expect(await url.isUrl('./assets/img/logo.png')).toBeFalsy();
    });
  });
});
