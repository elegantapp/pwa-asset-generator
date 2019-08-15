const execa = require('execa');
const file = require('./helpers/file');

test('throws error when input is not provided', async () => {
  try {
    await execa.sync('./cli.js', []);
  } catch (e) {
    expect(e.stderr).toContain('Please specify a URL or file path as a source');
  }
});

test('creates an output folder when output path does not exist', async () => {
  jest.setTimeout(30000);
  const tempFolderName = 'temp';
  await execa.sync('./cli.js', [
    './static/logo.png',
    tempFolderName,
    '-s=false',
    '--icon-only',
  ]);
  expect(await file.pathExists(tempFolderName)).toBe(true);
});

test('creates images', async () => {
  jest.setTimeout(30000);
  let flags = `
    --background="rgba(255, 255, 255, .5)"
    --scrape=false
    --icon-only
    `;

  flags = flags
    .trim()
    .replace(/(?<==)"|(?<!\\)"$/gm, '')
    .replace(/\\"/g, '"')
    .split('\n');

  const { stdout } = await execa('./cli.js', [
    './static/logo.png',
    './static',
    ...flags,
  ]);

  expect(stdout).toContain(
    'Below is the icons content for your manifest.json file. You can copy/paste it manually',
  );
  expect(stdout).toContain(
    'Below is the splash screen content for your index.html file. You can copy/paste it manually',
  );
});
