const execa = require('execa');
const file = require('./helpers/file');

const timeout = 60000;

test('throws error when input is not provided', async () => {
  try {
    await execa.sync('./cli.js', []);
  } catch (e) {
    expect(e.stderr).toContain('Please specify a URL or file path as a source');
  }
});

test('creates an output folder when output path does not exist', async () => {
  jest.setTimeout(timeout);
  const tempFolderName = 'temp';
  await execa.sync('./cli.js', [
    './static/logo.png',
    tempFolderName,
    '-s=false',
    '--icon-only',
  ]);
  expect(await file.pathExists(tempFolderName)).toBe(true);
});

test('generates icons only', async () => {
  jest.setTimeout(timeout);

  const { stdout } = await execa(
    './cli.js',
    ['./static/logo.png', './temp', '-s=false', '--icon-only'],
    { env: { PAG_NO_TRACE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates splash screens only', async () => {
  jest.setTimeout(timeout);

  const { stdout } = await execa(
    './cli.js',
    ['./static/logo.png', './temp', '-s=false', '--splash-only'],
    { env: { PAG_NO_TRACE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates portrait splash screens only', async () => {
  jest.setTimeout(timeout);

  const { stdout } = await execa(
    './cli.js',
    [
      './static/logo.png',
      './temp',
      '-s=false',
      '--splash-only',
      '--portrait-only',
    ],
    { env: { PAG_NO_TRACE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates landscape splash screens only', async () => {
  jest.setTimeout(timeout);

  const { stdout } = await execa(
    './cli.js',
    [
      './static/logo.png',
      './temp',
      '-s=false',
      '--splash-only',
      '--landscape-only',
    ],
    { env: { PAG_NO_TRACE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});

test('generates icons and splash screens when both only flags exist', async () => {
  jest.setTimeout(timeout);

  const { stdout } = await execa(
    './cli.js',
    ['./static/logo.png', './temp', '-s=false', '--splash-only', '--icon-only'],
    { env: { PAG_NO_TRACE: '1' } },
  );

  expect(stdout).toMatchSnapshot();
});
