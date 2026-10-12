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

### Why there's no npm-shrinkwrap.json

This repo pins its lockfile as `package-lock.json`, which npm excludes from
the published tarball — consumers resolve their own tree from `dependencies`
in `package.json`. An earlier revision of this fix shipped `npm-shrinkwrap.json`
instead (which npm *does* publish, pinning the resolved subtree for
consumers) on the assumption that `overrides` here needed to reach
installs of this package. That's unnecessary: none of the packages listed in
this `package.json`'s `overrides` (basic-ftp, lodash/lodash-es, npm, rollup,
postcss, js-yaml, fast-uri, nanoid, undici, ip-address, minimatch) appear
anywhere in the production dependency tree (`npm ls <pkg> --omit=dev`) — they
all exist only to patch devDependencies (semantic-release, vitest, eslint)
used to build and release this package, never installed by a consumer. If a
future override is added to patch something inside the *production* tree
(e.g. a puppeteer-core/@puppeteer/browsers transitive), shrinkwrap is the only
way to make that override reach consumers — see the npm docs on
`npm-shrinkwrap.json` vs `overrides` — and `scripts/verify-packaged-install.mjs`
(`npm run test:package`) should be used to confirm it actually does.
