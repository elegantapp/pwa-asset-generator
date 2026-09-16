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
node ./bin/cli.js ./static/logo.svg /tmp/pag-out -s false -t png -b coral
```

Assert on what the command produced: its exit code, the files under the output
directory, and the manifest/HTML it printed. `-s false` keeps it off the live
Apple HIG page, which is exactly what the `--scrape` default change is about —
add `-s true` only when the criterion is specifically about scraping, and treat
a network failure there as an environment fault rather than a defect.

## Do not run the whole test suite

`npm test` is `vitest run` across everything, and `src/main.test.ts` drives real
Puppeteer/Chromium flows that take minutes. On the GH-1276 mission QA started
the full suite, the sandbox stopped before it finished, and an acceptance
criterion was reported unverified with no pass/fail counts — the run proved
nothing and cost the time anyway.

Scope the run to the files your criteria actually touch:

```
npx vitest run src/helpers/puppets.test.ts src/cli.test.ts
```

Let CI own the full cross-platform suite. If a criterion genuinely needs it, say
so in the verdict rather than starting a run you cannot finish.

## Node

`engines.node` is `>=22.12.0`. A version below that fails in ways unrelated to
the change under test.
