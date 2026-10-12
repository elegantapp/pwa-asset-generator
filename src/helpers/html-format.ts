import jsBeautify from 'js-beautify';

// js-beautify already leaves these elements' content untouched (its HTML
// beautifier defaults `content_unformatted` to pre/textarea), but the
// comment-spacing regexes below operate on the whole serialized string, so
// they must skip these ranges too or they'll corrupt literal `<!--` text
// sitting inside a <pre>/<textarea>/<script>/<style> block.
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
