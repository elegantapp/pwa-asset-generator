// TODO: replace execa with exec/execFile of child_process as it doesn't support node < 8.3.0
import execa from 'execa';
import file from './helpers/file';

test('throws error when input is not provided', async () => {
  try {
    await execa.sync('./bin/cli', []);
  } catch (e) {
    expect(e.stderr).toContain('Please specify a URL or file path as a source');
  }
});

test('creates an output folder when output path does not exist', async () => {
  const tempFolderName = './temp';

  await execa.sync('./bin/cli', [
    './static/logo.png',
    tempFolderName,
    '-s=false',
    '--icon-only',
  ]);
  expect(await file.pathExists(tempFolderName)).toBe(true);
});

test('generates icons only', async () => {
  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--icon-only'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates splash screens only', async () => {
  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--splash-only'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates portrait splash screens only', async () => {
  const { stdout } = await execa(
    './bin/cli',
    [
      './static/logo.png',
      './temp',
      '-s=false',
      '--splash-only',
      '--portrait-only',
    ],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates landscape splash screens only', async () => {
  const { stdout } = await execa(
    './bin/cli',
    [
      './static/logo.png',
      './temp',
      '-s=false',
      '--splash-only',
      '--landscape-only',
    ],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates icons and splash screens when both only flags exist', async () => {
  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--splash-only', '--icon-only'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates icons and splash screens with path prefix', async () => {
  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--path=%PUBLIC_URL%'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});
