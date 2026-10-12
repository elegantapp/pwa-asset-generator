/**
 * Guards against GH-1280-style regressions: a production dependency that
 * the registry has marked deprecated (the source of `npm warn deprecated`
 * lines on every consumer install), or that `npm audit` flags as
 * vulnerable.
 *
 * Walks the production dependency tree from `npm ls --all --omit=dev
 * --json` (so overrides/resolutions are reflected, unlike reading
 * package-lock.json by hand), then queries the npm registry for each
 * unique name@version pair's `deprecated` field.
 *
 * Usage:
 *   npm run check:deps              # deprecation check only
 *   npm run check:deps -- --audit   # also runs `npm audit --omit=dev`
 */

import { execa } from 'execa';

const collectProdDependencies = (node, acc = new Map()) => {
  const deps = node.dependencies ?? {};
  for (const [name, dep] of Object.entries(deps)) {
    if (dep.version) {
      acc.set(`${name}@${dep.version}`, { name, version: dep.version });
    }
    collectProdDependencies(dep, acc);
  }
  return acc;
};

const fetchDeprecationNotice = async ({ name, version }) => {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
  );
  if (!response.ok) {
    return null;
  }
  const manifest = await response.json();
  return manifest.deprecated ?? null;
};

const checkDeprecations = async () => {
  const { stdout } = await execa('npm', [
    'ls',
    '--all',
    '--omit=dev',
    '--json',
  ]);
  const tree = JSON.parse(stdout);
  const packages = [...collectProdDependencies(tree).values()];

  const results = await Promise.all(
    packages.map(async (pkg) => ({
      ...pkg,
      notice: await fetchDeprecationNotice(pkg),
    })),
  );

  const deprecated = results.filter((result) => result.notice);

  if (deprecated.length > 0) {
    console.error('Deprecated production dependencies found:\n');
    for (const { name, version, notice } of deprecated) {
      console.error(`  ${name}@${version}: ${notice}`);
    }
    return false;
  }

  console.log(
    `OK: no deprecated production dependencies (${packages.length} checked).`,
  );
  return true;
};

const checkAudit = async () => {
  const result = await execa('npm', ['audit', '--omit=dev'], {
    reject: false,
    stdio: 'inherit',
  });

  if (result.exitCode !== 0) {
    console.error(
      '\nnpm audit reported vulnerabilities in production dependencies.',
    );
    return false;
  }

  console.log(
    'OK: npm audit reports 0 vulnerabilities in production dependencies.',
  );
  return true;
};

const main = async () => {
  const runAudit = process.argv.includes('--audit');

  const deprecationsOk = await checkDeprecations();
  const auditOk = runAudit ? await checkAudit() : true;

  if (!deprecationsOk || !auditOk) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
