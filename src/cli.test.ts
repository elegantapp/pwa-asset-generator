import execa from 'execa';
import constants from './config/constants';

describe('CLI', () => {
  test('does not throw when there is not any arg', async () => {
    expect(() => execa.sync('./bin/cli', [])).not.toThrow();
  });

  test('integrates with main API and creates an output with generated meta', async () => {
    let response = { stdout: '', stderr: '' };
    try {
      response = await execa(
        './bin/cli',
        [
          './static/logo.png',
          './temp',
          '--scrape=false',
          '--splash-only',
          '--landscape-only',
          '--favicon',
          '--path="%PUBLIC_URL%"',
          '--dark-mode',
          '--type=jpg',
          '--quality=20',
        ],
        { env: { PAG_TEST_MODE: '1' } },
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    expect(response.stdout).toMatchSnapshot();
  });

  test('does not have any conflicting shorthand options', () => {
    const flagShorthands = Object.values(constants.FLAGS).map(
      (flag) => flag.alias,
    );
    expect(new Set(flagShorthands).size).toBe(flagShorthands.length);
  });

  test('integrates with npx', async () => {
    let response = { stdout: '', stderr: '' };
    try {
      response = await execa(
        'npx',
        [
          '-p .',
          'pwa-asset-generator',
          './static/logo.png',
          './temp',
          '--scrape=false',
          '--splash-only',
          '--landscape-only',
          '--favicon',
          '--path="%PUBLIC_URL%"',
          '--dark-mode',
          '--type=jpg',
          '--quality=20',
        ],
        { env: { PAG_TEST_MODE: '1' } },
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    expect(response.stdout).toMatchSnapshot();
  });
});
