/**
 * Scans the committed package-lock.json for production-tree packages that
 * npm has flagged as deprecated, so a bad transitive bump shows up in CI
 * instead of a user's `npm install` log (see GH-1280).
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
