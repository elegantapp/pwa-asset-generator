const execa = require('execa');

test('throws error when input is not provided', async () => {
  try {
    await execa.sync('./cli.js', []);
  } catch (e) {
    expect(e.stderr).toContain('Please specify a URL or file path as a source');
  }
});

test('throws error when wrong output is provided', async () => {
  try {
    await execa.sync('./cli.js', ['./static/logo.png', 'unknown_folder']);
  } catch (e) {
    expect(e.stderr).toContain(
      'Make sure output folder unknown_folder exists and writable',
    );
  }
});

test('creates images', async () => {
  jest.setTimeout(30000);
  let flags = `
    --background="rgba(255, 255, 255, .5)"
    --scrape=false
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
