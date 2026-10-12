## Vendored js-beautify HTML/CSS/JS beautifier core

This directory is `js-beautify@2.0.3`'s `js/src/{core,html,javascript,css}` and
`js/src/index.js`, copied verbatim (see `LICENSE`, MIT).

It exists so `src/helpers/html-format.ts` can call the exact same `.html()`
beautifier js-beautify ships, without declaring `js-beautify` as an npm
dependency. `js-beautify`'s `package.json` depends on `nopt`, `glob`,
`config-chain`, `editorconfig` and `js-cookie`, all used only by its CLI
(`js/src/cli.js`, not vendored here). `nopt`'s current releases declare
`engines.node` ranges that exclude this project's minimum supported Node
version, so any install of `js-beautify` as a real npm dependency produces an
EBADENGINE warning for consumers on Node 22.12.0 (GH-1280) — and because npm
only honors a package's own `overrides` for its own installs, not when the
package is installed as a dependency elsewhere (e.g. `npm install -g
pwa-asset-generator`), there is no `overrides`/`npm-shrinkwrap.json` fix that
reaches consumers. Vendoring only the dependency-free beautifier core avoids
the chain entirely while keeping identical formatting output.

This directory has its own `package.json` with `"type": "commonjs"` because
these files use `require`/`module.exports` and the rest of this project is
`"type": "module"`; `src/helpers/html-format.ts` loads this module with
`createRequire` accordingly.

Do not hand-edit these files; if js-beautify's HTML beautifier needs an
upstream fix, pull the new file(s) from the matching js-beautify release.
