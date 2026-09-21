---
name: qa
description: How to exercise pwa-asset-generator — a CLI with no deployed surface.
---

## There is no preview environment

This repo ships a CLI to npm. Nothing is deployed, so there is no URL to drive
and no browser session to open. The surface under test is **the built CLI**.

## Verify against the locally built binary

Build first, then invoke `bin/cli.js` directly — that is the same entry point
`npx pwa-asset-generator` resolves to, so exercising it is exercising what users
get:

```
npm ci
npm run chromium      # installs the Chromium the CLI drives; skip and it fails
npm run build         # rimraf ./dist && tsc && copy config JSON into dist
node ./bin/cli.js --help
```

`--help` is the source of truth for the flags — read it rather than carrying
assumptions about option names or defaults, both of which change between
versions. Then compose the smallest invocation that exercises the acceptance
criteria, using the fixtures already in `static/` for input.

Assert on what the command actually produced: its exit code, the files under the
output directory, and whatever it printed to stdout.

## Do not run the whole test suite

`npm test` is `vitest run` across everything, and `src/main.test.ts` drives real
Puppeteer/Chromium flows that take minutes — long enough that the sandbox can
end before the run does, leaving no pass/fail counts and a criterion you cannot
honestly call verified.

Scope the run to the files your criteria actually touch:

```
npx vitest run src/helpers/puppets.test.ts src/cli.test.ts
```

Let CI own the full cross-platform suite. If a criterion genuinely needs it, say
so in the verdict rather than starting a run you cannot finish.

## Node

`engines.node` is `>=22.12.0`. A version outside that range fails in ways
unrelated to the change under test.
