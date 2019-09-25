// TODO: replace execa with exec/execFile of child_process as it doesn't support node < 8.3.0
import execa from 'execa';
import file from './helpers/file';

const TEST_TIMEOUT_IN_MILLIS = 90000;

test('throws error when input is not provided', async () => {
  try {
    await execa.sync('./bin/cli', []);
  } catch (e) {
    expect(e.stderr).toContain('Please specify a URL or file path as a source');
  }
});

test('creates an output folder when output path does not exist', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);
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
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--icon-only'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates splash screens only', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--splash-only'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates portrait splash screens only', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

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
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

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
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--splash-only', '--icon-only'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates icons and splash screens with path prefix', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const { stdout } = await execa(
    './bin/cli',
    ['./static/logo.png', './temp', '-s=false', '--path=%PUBLIC_URL%'],
    { env: { PAG_TEST_MODE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});
