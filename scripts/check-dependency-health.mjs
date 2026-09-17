/**
 * Scans the committed package-lock.json for production-tree packages that
 * npm has flagged as deprecated, so a maintainer can catch a bad transitive
 * bump by running this locally before it reaches a user's `npm install` log
 * (see GH-1280). This is a manual/local check — it is not wired into CI, so
 * it only helps if someone runs it before a release.
 *
 * Note: a package only shows up here if npm recorded a `deprecated` field
 * for it in the lockfile at resolve time. A deprecation issued by the
 * registry after the lockfile was last regenerated will not be caught until
 * the next `npm install`/`npm update` refreshes that entry.
 *
 * Note: this only reflects what THIS repo's own install resolves to. If
 * package.json's `overrides` field bumps a transitive package away from a
 * deprecated version, this check goes clean here even though downstream
 * consumers of the published package still get the deprecated version —
 * `overrides` only apply to the project that declares them, never to
 * installs where this package is itself a dependency. Verify with a real
 * `npm pack` + tarball install into a scratch project before trusting a
 * clean result here as proof the shipped tree is deprecation-free.
 *
 * Usage:
 *   node scripts/check-dependency-health.mjs [--json] [--audit]
 *
 *   --json   Print machine-readable findings instead of a human summary.
 *   --audit  Additionally run `npm audit --omit=dev --audit-level=low`.
 *
 * Exits 1 if any non-dev package-lock.json entry carries a `deprecated`
 * field, or (with --audit) if npm audit reports a production vulnerability.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const lockfilePath = path.join(rootDir, 'package-lock.json');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const runAudit = args.includes('--audit');

const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const packages = lockfile.packages ?? {};

const nameFromKey = (key) =>
  key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length);

const parentsFor = (name) => {
  const parents = new Set();
  for (const [key, entry] of Object.entries(packages)) {
    const deps = {
      ...entry.dependencies,
      ...entry.optionalDependencies,
      ...entry.peerDependencies,
    };
    if (Object.prototype.hasOwnProperty.call(deps, name)) {
      parents.add(key === '' ? '(root)' : nameFromKey(key));
    }
  }
  return [...parents];
};

const findings = [];
for (const [key, entry] of Object.entries(packages)) {
  if (key === '' || entry.dev) continue;
  if (typeof entry.deprecated !== 'string' || entry.deprecated.length === 0) {
    continue;
  }

  const name = nameFromKey(key);
  findings.push({
    name,
    version: entry.version,
    deprecated: entry.deprecated,
    requiredBy: parentsFor(name),
  });
}

let auditExitCode = null;
let auditOutput = '';
if (runAudit) {
  try {
    auditOutput = execFileSync(
      'npm',
      ['audit', '--omit=dev', '--audit-level=low'],
      { cwd: rootDir, encoding: 'utf8' },
    );
    auditExitCode = 0;
  } catch (error) {
    auditExitCode = typeof error.status === 'number' ? error.status : 1;
    auditOutput = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
}

const hasFindings = findings.length > 0;
const auditFailed = runAudit && auditExitCode !== 0;

if (jsonOutput) {
  console.log(
    JSON.stringify({ findings, auditExitCode, auditOutput }, null, 2),
  );
} else if (hasFindings) {
  console.log(`Found ${findings.length} deprecated production package(s):\n`);
  for (const finding of findings) {
    console.log(`  ${finding.name}@${finding.version}`);
    console.log(`    ${finding.deprecated}`);
    console.log(
      `    required by: ${finding.requiredBy.length ? finding.requiredBy.join(', ') : 'unknown'}`,
    );
  }
} else {
  console.log('No deprecated production-tree packages found.');
}

if (runAudit && !jsonOutput) {
  console.log(auditOutput.trim());
  console.log(
    auditFailed
      ? '\nnpm audit reported production vulnerabilities.'
      : '\nnpm audit reported no production vulnerabilities.',
  );
}

process.exit(hasFindings || auditFailed ? 1 : 0);
