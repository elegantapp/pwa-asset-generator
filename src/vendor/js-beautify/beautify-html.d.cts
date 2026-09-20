// Hand-written declaration for the vendored beautify-html.cjs (see that file
// for why it's vendored rather than depending on the js-beautify package).
// Mirrors the subset of js-beautify@2.0.3's HTML `Options` this repo calls,
// verified against node_modules/js-beautify/js/lib/beautify-html.js.
export interface HTMLBeautifyOptions {
  indent_size?: number;
  indent_char?: string;
  indent_inner_html?: boolean;
  indent_body_inner_html?: boolean;
  indent_head_inner_html?: boolean;
  indent_handlebars?: boolean;
  wrap_attributes?:
    | 'auto'
    | 'force'
    | 'force-aligned'
    | 'force-expand-multiline'
    | 'aligned-multiple'
    | 'preserve'
    | 'preserve-aligned';
  wrap_attributes_min_attrs?: number;
  wrap_attributes_indent_size?: number;
  wrap_line_length?: number;
  extra_liners?: string[];
  inline?: string[];
  inline_custom_elements?: boolean;
  void_elements?: string[];
  unformatted?: string[];
  content_unformatted?: string[];
  unformatted_content_delimiter?: string;
  indent_scripts?: 'normal' | 'keep' | 'separate';
  preserve_newlines?: boolean;
  max_preserve_newlines?: boolean | number;
  templating?: string[];
}

export function html_beautify(
  html_source: string,
  options?: HTMLBeautifyOptions,
): string;
