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

const UNFORMATTED_TAGS = ['code', 'pre', 'em', 'strong', 'span'];

// The comment-spacing regexes below run over the whole serialized document,
// but `UNFORMATTED_TAGS` content (e.g. a comment node inside a <pre>) is
// meant to be preserved byte-for-byte - injecting a newline there would
// corrupt significant whitespace. Swap those blocks out for placeholders
// before the regexes run, then restore them verbatim afterwards.
const UNFORMATTED_BLOCK_PATTERN = new RegExp(
  `<(${UNFORMATTED_TAGS.join('|')})\\b[^>]*>[\\s\\S]*?<\\/\\1>`,
  'gi',
);
const PLACEHOLDER_MARKER = 'PAG_UNFORMATTED_BLOCK_';

const protectUnformattedBlocks = (
  html: string,
): { html: string; blocks: string[] } => {
  const blocks: string[] = [];
  const protectedHtml = html.replace(UNFORMATTED_BLOCK_PATTERN, (match) => {
    const placeholder = `${PLACEHOLDER_MARKER}${blocks.length}_END_`;
    blocks.push(match);
    return placeholder;
  });
  return { html: protectedHtml, blocks };
};

const restoreUnformattedBlocks = (html: string, blocks: string[]): string =>
  blocks.reduce(
    (result, block, index) =>
      // Use a function replacement so `$`-substitution patterns (`$$`, `$&`,
      // `` $` ``, `$'`) inside the restored block are never interpreted by
      // String.prototype.replace - the block must come back byte-for-byte.
      result.replace(`${PLACEHOLDER_MARKER}${index}_END_`, () => block),
    html,
  );

// Re-implements `pretty(html, { ocd: true })`'s output on top of the
// underlying js-beautify HTML beautifier, since `pretty` was dropped for
// pulling in a deprecated, vulnerable `glob` transitively (GH-1280).
const formatHtml = (html: string): string => {
  const beautified = beautify.html(html, {
    unformatted: UNFORMATTED_TAGS,
    indent_inner_html: true,
    indent_char: ' ',
    indent_size: 2,
  });

  const trimmed = condenseNewlines(beautified)
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '\n');

  const { html: protectedHtml, blocks } = protectUnformattedBlocks(trimmed);

  const commentSpaced = protectedHtml
    .replace(/(\s*<!--)/g, '\n$1')
    .replace(/>(\s*)(?=<!--\s*\/)/g, '> ');

  return restoreUnformattedBlocks(commentSpaced, blocks);
};

export default {
  formatHtml,
};
