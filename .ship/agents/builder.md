---
name: builder
description: Repo-specific build discipline for pwa-asset-generator.
---

## Before you push

CI runs Type checking, Linting, Formatting and Tests as separate jobs, and any
one of them red is a failed run. All four are runnable here in seconds, so a
push that fails them costs a full CI round trip for nothing:

```
npm run tsc          # tsc --noEmit
npm run lint:fix     # eslint . --fix   (then `npm run lint` to confirm)
npm run prettier:fix # prettier . --write
```

Run all three and re-run `npm run tsc` and `npm run lint` until clean. Treat
formatting as part of the change, not a follow-up: a commit that only fixes
formatting is a wasted cycle.

Each of these failing in CI instead of locally costs a full round trip — push,
wait for the matrix, read the log, push again — to learn something the repo will
tell you in seconds.

## Tests

`npm test` is `vitest run` over the WHOLE suite, and `src/main.test.ts` drives a
real Chromium through Puppeteer. It is slow and needs a browser present
(`npm run chromium` installs it). When you only need to prove your own change,
scope the run:

```
npx vitest run src/helpers/puppets.test.ts src/cli.test.ts
```

Leave the full suite to CI, which runs it across three operating systems.

## Scope

Changes to `.github/workflows/` are out of scope unless the issue or a
maintainer comment explicitly asks for them.
