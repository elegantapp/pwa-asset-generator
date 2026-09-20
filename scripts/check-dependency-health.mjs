/**
 * Scans the committed package-lock.json for production-tree packages that
 * npm has flagged as deprecated, so a maintainer can catch a bad transitive
 * bump by running this locally before it reaches a user's `npm install` log
 * (see GH-1280). Wired into the "Dependency health" CI job and the release
 * workflow (both run `npm run check:deps -- --audit`), and can also be run
 * locally at any time.
 *
 * Note: a package only shows up here if npm recorded a `deprecated` field
 * for it in the lockfile at resolve time. A deprecation issued by the
 * registry after the lockfile was last regenerated will not be caught until
 * the next `npm install`/`npm update` refreshes that entry.
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
let auditSpawnError = null;
if (runAudit) {
  try {
    auditOutput = execFileSync(
      'npm',
      ['audit', '--omit=dev', '--audit-level=low'],
      { cwd: rootDir, encoding: 'utf8' },
    );
    auditExitCode = 0;
  } catch (error) {
    if (typeof error.status !== 'number') {
      // npm exited with a real audit failure (vulnerabilities found) reports
      // a numeric `status`. Anything else (e.g. ENOENT because `npm` isn't on
      // PATH, or `npm.cmd` refused without a shell) means audit never ran at
      // all, which must not be reported as "vulnerabilities found".
      auditSpawnError = error;
    } else {
      auditExitCode = error.status;
      auditOutput = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    }
  }
}

const hasFindings = findings.length > 0;
const auditFailed = runAudit && auditExitCode !== null && auditExitCode !== 0;

if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        findings,
        auditExitCode,
        auditOutput,
        auditSpawnError: auditSpawnError?.message ?? null,
      },
      null,
      2,
    ),
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
  if (auditSpawnError) {
    console.error(`npm audit could not be run: ${auditSpawnError.message}`);
  } else {
    console.log(auditOutput.trim());
    console.log(
      auditFailed
        ? '\nnpm audit reported production vulnerabilities.'
        : '\nnpm audit reported no production vulnerabilities.',
    );
  }
}

process.exit(hasFindings || auditFailed || Boolean(auditSpawnError) ? 1 : 0);
