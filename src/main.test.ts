import { generateImages } from './main';

const TEST_TIMEOUT_IN_MILLIS = 90000;

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
