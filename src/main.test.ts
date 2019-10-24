import { generateImages } from './main';

const TEST_TIMEOUT_IN_MILLIS = 120000;

test('generates icons and splash screens when called via function', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    iconOnly: true,
    splashOnly: true,
    log: false,
    path: '%PUBLIC_URL%',
  });

  expect(result).toMatchSnapshot();
});

test('generates favicon html as part of htmlMeta', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    iconOnly: true,
    favicon: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});

test('generates dark mode splash screen html as part of htmlMeta', async () => {
  jest.setTimeout(TEST_TIMEOUT_IN_MILLIS);

  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    splashOnly: true,
    type: 'jpeg',
    quality: 80,
    darkMode: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});
