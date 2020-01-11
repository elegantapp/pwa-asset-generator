import execa from 'execa';

describe('CLI', () => {
  test('throws error when input is not provided', async () => {
    expect(() => execa.sync('./bin/cli', [])).toThrow();
  });

  test('integrates with main API and creates an output with generated meta', async () => {
    let response = { stdout: '', stderr: '' };
    try {
      response = await execa(
        './bin/cli',
        [
          './static/logo.png',
          './temp',
          '-s=false',
          '--splash-only',
          '--landscape-only',
          '--favicon',
          '-a="%PUBLIC_URL%"',
          '--dark-mode',
          '--type=jpeg',
          '-q=20',
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
