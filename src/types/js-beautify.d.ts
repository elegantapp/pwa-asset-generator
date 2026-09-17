// Local ambient declaration for the js-beautify v2 surface this repo actually
// calls (`beautify.html()`). js-beautify@2 ships no type declarations of its
// own, and @types/js-beautify (latest 1.14.3) hasn't been republished against
// the v2 major, so trusting it risks silently typechecking against a stale
// API. The options below are verified against
// node_modules/js-beautify/js/lib/beautify-html.js's `Options` constructor
// for v2.0.3 rather than assumed from the old @types package.
declare module 'js-beautify' {
  interface HTMLBeautifyOptions {
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

  interface Beautify {
    html(html_source: string, options?: HTMLBeautifyOptions): string;
  }

  const beautify: Beautify;
  export default beautify;
}
