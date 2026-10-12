import { describe, test, expect } from 'vitest';
import htmlFormat from './html-format.js';

describe('html-format helper', () => {
  describe('with formatHtml', () => {
    test('keeps a comment inside <pre> byte-for-byte unchanged', () => {
      const input =
        '<html><head></head><body><pre>a<!--x-->b</pre></body></html>';

      expect(htmlFormat.formatHtml(input)).toContain('<pre>a<!--x-->b</pre>');
    });

    test('keeps a comment inside <textarea> byte-for-byte unchanged', () => {
      const input =
        '<html><head></head><body><textarea>line1<!--kept--></textarea></body></html>';

      expect(htmlFormat.formatHtml(input)).toContain(
        '<textarea>line1<!--kept--></textarea>',
      );
    });

    test('adds a newline before a comment outside unformatted elements', () => {
      const input =
        '<html><head><!-- Icons --><link rel="icon" href="a.png"></head><body>hi</body></html>';

      expect(htmlFormat.formatHtml(input)).toContain('\n<!-- Icons -->');
    });

    test('pulls a closing comment onto the previous line outside unformatted elements', () => {
      const input =
        '<html><head><link rel="icon" href="a.png"><!-- /Icons --></head><body>hi</body></html>';

      expect(htmlFormat.formatHtml(input)).toContain(
        '<link rel="icon" href="a.png"> <!-- /Icons -->',
      );
    });
  });
});
