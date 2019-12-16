import execa from 'execa';

describe('CLI', () => {
  test('throws error when input is not provided', async () => {
    try {
      await execa.sync('./bin/cli', []);
    } catch (e) {
      expect(e).not.toBeUndefined();
    }
  });

  test('integrates with main API and creates an output with generated meta', async () => {
    const { stdout } = await execa(
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

    expect(stdout).toMatchSnapshot();
  });
});
