import { describe, it, expect } from 'vitest';
import htmlFormat from './html-format.js';

describe('HTML format helper', () => {
  it('indents nested markup and condenses blank lines', async () => {
    const input = `<html>
<head>
<title>Test</title>


<link rel="icon" href="favicon.ico">
</head>
<body>
<span>inline text</span>
</body>
</html>`;

    expect(await htmlFormat.formatHtml(input)).toBe(
      `<html>
  <head>
    <title>Test</title>

    <link rel="icon" href="favicon.ico">
  </head>
  <body>
    <span>inline text</span>
  </body>
</html>
`,
    );
  });

  it('leaves <pre> content, including a nested comment, untouched', async () => {
    const input = `<html>
<head>
<title>Test</title>
</head>
<body>
<pre>line one<!-- inline note -->line   two</pre>
</body>
</html>`;

    expect(await htmlFormat.formatHtml(input)).toBe(
      `<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <pre>line one<!-- inline note -->line   two</pre>
  </body>
</html>
`,
    );
  });

  it('does not corrupt a comment-shaped string literal inside a <script>', async () => {
    const input = `<html>
<head>
<title>Test</title>
</head>
<body>
<script>const marker = "<!-- start -->";</script>
</body>
</html>`;

    const result = await htmlFormat.formatHtml(input);

    expect(result).toContain('const marker = "<!-- start -->";');
  });

  it('leaves <textarea> content untouched', async () => {
    const input = `<html>
<head>
<title>Test</title>
</head>
<body>
<textarea>  keep\tthis   spacing</textarea>
</body>
</html>`;

    const result = await htmlFormat.formatHtml(input);

    expect(result).toContain('<textarea>  keep\tthis   spacing</textarea>');
  });

  it('does not self-close void elements when xhtml is false', async () => {
    const input = `<html>
<head>
<meta name="apple-mobile-web-app-capable" content="yes">
</head>
<body></body>
</html>`;

    const result = await htmlFormat.formatHtml(input, false);

    expect(result).toContain(
      '<meta name="apple-mobile-web-app-capable" content="yes">',
    );
    expect(result).not.toContain('/>');
  });

  it('self-closes void elements when xhtml is true', async () => {
    const input = `<html>
<head>
<meta name="apple-mobile-web-app-capable" content="yes" />
</head>
<body></body>
</html>`;

    const result = await htmlFormat.formatHtml(input, true);

    expect(result).toContain(
      '<meta name="apple-mobile-web-app-capable" content="yes" />',
    );
  });

  it('keeps a long single-attribute link tag on one line', async () => {
    const media =
      '(prefers-color-scheme: dark) and (device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)';
    const input = `<html><head><link rel="apple-touch-startup-image" href="temp/img.png" media="${media}"></head><body></body></html>`;

    const result = await htmlFormat.formatHtml(input);

    expect(result).toContain(
      `<link rel="apple-touch-startup-image" href="temp/img.png" media="${media}">`,
    );
  });

  it('falls back to the unformatted markup when Prettier cannot parse it', async () => {
    // A stray closing tag on a void element - invalid HTML that Prettier's
    // parser rejects outright, but that upstream xhtml parsing in meta.ts can
    // produce from a pre-existing non-xhtml index.html (see main.test.ts's
    // "with xhtml index output" case).
    const input =
      '<html><head><meta name="a" content="b"></meta></head></html>';

    await expect(htmlFormat.formatHtml(input)).resolves.toBe(input);
  });
});
