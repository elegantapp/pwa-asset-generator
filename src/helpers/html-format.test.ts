import { describe, it, expect } from 'vitest';
import htmlFormat from './html-format.js';

describe('HTML format helper', () => {
  it('indents nested markup, condenses blank lines, spaces out comments, and leaves unformatted tags untouched', () => {
    const input = `<html>
<head>


<title>Test</title>
<!-- start icons -->
<link rel="icon" href="favicon.ico">
<!-- end icons -->
</head>
<body>
<pre>  keep   spacing  </pre>
<span>inline   text</span>
</body>
</html>`;

    expect(htmlFormat.formatHtml(input)).toBe(
      `<html>
  <head>
    <title>Test</title>

    <!-- start icons -->
    <link rel="icon" href="favicon.ico">

    <!-- end icons -->
  </head>
  <body>
    <pre>  keep   spacing  </pre>
    <span>inline   text</span>
  </body>
</html>`,
    );
  });

  it('does not inject a newline before a comment nested inside a <pre>', () => {
    const input = `<html>
<head>
<title>Test</title>
</head>
<body>
<pre>line one<!-- inline note -->line two</pre>
</body>
</html>`;

    expect(htmlFormat.formatHtml(input)).toBe(
      `<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <pre>line one<!-- inline note -->line two</pre>
  </body>
</html>`,
    );
  });
});
