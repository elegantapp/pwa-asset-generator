import { format } from 'prettier';

const VOID_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

// Prettier's HTML printer always emits a self-closing `/>` on void elements,
// regardless of how they were written in the input. That's at odds with this
// project's `xhtml` option, which callers use to decide for themselves
// whether generated tags are self-closed (see `serializeHtmlDocument` in
// meta.ts). Undo it for non-xhtml output so a caller's own tag strings still
// match verbatim inside the formatted document. Scoped to the void element
// tag names only, so it can't touch unrelated `/>`-shaped text elsewhere in
// the document.
const VOID_SELF_CLOSING_PATTERN = new RegExp(
  `<(${VOID_ELEMENTS.join('|')})((?:\\s+[^<>]*)?)\\s*/>`,
  'gi',
);

// Normalizes any already-self-closed void element to this project's chosen
// style for the given mode (` />` for xhtml, `>` otherwise), regardless of
// whether Prettier or a fallback serializer produced the self-closing slash.
// Scoped to the void element tag names only, so it can't touch unrelated
// `/>`-shaped text elsewhere in the document.
const normalizeVoidElements = (html: string, xhtml: boolean): string =>
  html.replace(
    VOID_SELF_CLOSING_PATTERN,
    (_match, tag: string, attrs: string) => {
      const trimmedAttrs = attrs.replace(/\s+$/, '');
      return xhtml ? `<${tag}${trimmedAttrs} />` : `<${tag}${trimmedAttrs}>`;
    },
  );

// Formats an HTML document with Prettier. `printWidth` is set to `Infinity`
// because several generated tags (e.g. Apple splash screen `<link>` media
// queries) are single, long attribute lists that callers match against
// verbatim - wrapping them across lines would both look odd for a single
// attribute and break those lookups.
const formatHtml = async (html: string, xhtml = false): Promise<string> => {
  let formatted: string;
  try {
    formatted = await format(html, { parser: 'html', printWidth: Infinity });
  } catch {
    // Prettier's HTML parser is strict about markup that upstream parsing in
    // this codebase can still hand it - e.g. a stray closing tag on a void
    // element, which htmlparser2's xmlMode (used for `xhtml` documents) can
    // produce from a pre-existing non-xhtml index.html. Fall back to the
    // unformatted markup (still normalized below) rather than failing the
    // whole generation over a cosmetic step.
    formatted = html;
  }

  return normalizeVoidElements(formatted, xhtml);
};

export default {
  formatHtml,
};
