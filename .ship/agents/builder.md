---
name: builder
description: Repo-specific build discipline for pwa-asset-generator.
---

## What CI will judge

CI runs Type checking, Linting, Formatting, Commit message linting and Tests as
separate jobs; any one red is a failed run. Linting and Formatting largely take
care of themselves — `.husky/pre-commit` runs `lint-staged`, which applies
`eslint --fix` and `prettier --write` to staged `.js`/`.ts` files as you commit.

That leaves the two CI checks nothing fixes for you:

```
npm run tsc     # tsc --noEmit — type errors are yours to resolve
npm run lint    # eslint . — reports what --fix could not repair
```

Run both before pushing. A type error or an unfixable lint rule is worth a local
minute; through CI it is a round trip of push, wait for the matrix, read the log,
push again.

Commit messages are linted too, so keep the conventional-commit form
(`fix(scope): summary`).

## Tests

`npm test` is `vitest run` over the WHOLE suite, and `src/main.test.ts` drives a
real Chromium through Puppeteer — slow, and it needs the browser present
(`npm run chromium` installs it). To prove your own change, scope the run:

```
npx vitest run src/helpers/puppets.test.ts src/cli.test.ts
```

Leave the full suite to CI, which runs it across three operating systems.

## Scope

Changes to `.github/workflows/` are out of scope unless the issue or a
maintainer comment explicitly asks for them.
