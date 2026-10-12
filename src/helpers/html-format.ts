import { createRequire } from 'node:module';

// Vendored js-beautify HTML/CSS/JS beautifier core (see
// src/vendor/js-beautify/README.md for why this isn't the `js-beautify` npm
// package). It's CommonJS, loaded with `require` since this project is
// `"type": "module"`.
const require = createRequire(import.meta.url);
const jsBeautify = require('../vendor/js-beautify/index.js') as {
  html: (html: string, options?: Record<string, unknown>) => string;
};

// js-beautify already leaves these elements' content untouched (its HTML
// beautifier defaults `content_unformatted` to pre/textarea), but the
// comment-spacing regexes below operate on the whole serialized string, so
// they must skip these ranges too or they'll corrupt literal `<!--` text
// sitting inside a <pre>/<textarea>/<script>/<style> block.
//
// The `<script>`/`<style>` branches use a lazy match up to the first
// closing tag, so a `<script>` body containing a `'</script>'` string
// literal would end the preserved range early and let comment-spacing rules
// apply to the remainder of that script. Not a concern for the meta tags
// this module generates, but a hand-authored index.html could hit it.
const UNFORMATTED_ELEMENTS_PATTERN =
  /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

const BEAUTIFY_OPTIONS = {
  indent_size: 2,
  indent_char: ' ',
  indent_inner_html: true,
  unformatted: ['code', 'pre', 'em', 'strong', 'span'],
};

const splitOnUnformattedRanges = (
  html: string,
): { text: string; preserve: boolean }[] => {
  const segments: { text: string; preserve: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  UNFORMATTED_ELEMENTS_PATTERN.lastIndex = 0;
  while ((match = UNFORMATTED_ELEMENTS_PATTERN.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: html.slice(lastIndex, match.index),
        preserve: false,
      });
    }
    segments.push({ text: match[0], preserve: true });
    lastIndex = UNFORMATTED_ELEMENTS_PATTERN.lastIndex;
  }
  if (lastIndex < html.length) {
    segments.push({ text: html.slice(lastIndex), preserve: false });
  }

  return segments;
};

// Mirrors the `pretty` package's "ocd" post-processing: a blank line above
// each comment, and closing comments pulled up onto the previous line.
const applyCommentSpacing = (text: string): string =>
  text.replace(/(\s*<!--)/g, '\n$1').replace(/>(\s*)(?=<!--\s*\/)/g, '> ');

const formatHtml = (html: string): string => {
  const beautified = jsBeautify
    .html(html, BEAUTIFY_OPTIONS)
    .replace(/^\s+/, '')
    .replace(/\s+$/, '\n');

  return splitOnUnformattedRanges(beautified)
    .map((segment) =>
      segment.preserve ? segment.text : applyCommentSpacing(segment.text),
    )
    .join('');
};

export default {
  formatHtml,
};
