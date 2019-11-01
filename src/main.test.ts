import { generateImages } from './main';

test.concurrent('generates icons only', async () => {
  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    iconOnly: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});

test.concurrent('generates splash screens only', async () => {
  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    splashOnly: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});

test.concurrent('generates portrait splash screens only', async () => {
  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    splashOnly: true,
    portraitOnly: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});

test.concurrent('generates landscape splash screens only', async () => {
  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    splashOnly: true,
    landscapeOnly: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});

test.concurrent(
  'generates icons and splash screens when both only flags exist',
  async () => {
    const result = await generateImages('./static/logo.png', './temp', {
      scrape: false,
      iconOnly: true,
      splashOnly: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  },
);

test.concurrent(
  'generates icons and splash screens with path prefix',
  async () => {
    const result = await generateImages('./static/logo.png', './temp', {
      scrape: false,
      path: '%PUBLIC_URL%',
      log: false,
    });

    expect(result).toMatchSnapshot();
  },
);

test.concurrent('generates favicon html as part of htmlMeta', async () => {
  const result = await generateImages('./static/logo.png', './temp', {
    scrape: false,
    iconOnly: true,
    favicon: true,
    log: false,
  });

  expect(result).toMatchSnapshot();
});

test.concurrent(
  'generates dark mode splash screen html as part of htmlMeta',
  async () => {
    const result = await generateImages('./static/logo.png', './temp', {
      scrape: false,
      splashOnly: true,
      type: 'jpeg',
      quality: 80,
      darkMode: true,
      log: false,
    });

    expect(result).toMatchSnapshot();
  },
);
