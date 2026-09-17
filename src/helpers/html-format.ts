import beautify from 'js-beautify';

// Condenses runs of 2+ newlines down to a single newline, trimming
// whitespace-only lines first so they don't count as content.
const condenseNewlines = (str: string): string => {
  const trimmedBlankLines = str
    .split('\n')
    .map((line) => (/^\s*$/.test(line) ? line.trim() : line))
    .join('\n');

  return trimmedBlankLines
    .replace(/\s+$/, '\n')
    .replace(/(\r\n|\n|␤){2,}/g, '\n');
};

// Re-implements `pretty(html, { ocd: true })`'s output on top of the
// underlying js-beautify HTML beautifier, since `pretty` was dropped for
// pulling in a deprecated, vulnerable `glob` transitively (GH-1280).
const formatHtml = (html: string): string => {
  const beautified = beautify.html(html, {
    unformatted: ['code', 'pre', 'em', 'strong', 'span'],
    indent_inner_html: true,
    indent_char: ' ',
    indent_size: 2,
  });

  return condenseNewlines(beautified)
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '\n')
    .replace(/(\s*<!--)/g, '\n$1')
    .replace(/>(\s*)(?=<!--\s*\/)/g, '> ');
};

export default {
  formatHtml,
};
