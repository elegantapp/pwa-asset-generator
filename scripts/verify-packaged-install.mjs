/**
 * Reproduces GH-1282: import 'pwa-asset-generator' after a hoisting-free
 * install must not throw ERR_MODULE_NOT_FOUND for an undeclared dependency.
 *
 * Packs the current package, installs the tarball into an empty temp
 * project with --install-strategy=nested (no hoisting to the root
 * node_modules), then imports the package as an ES module and asserts the
 * child process exits 0.
 *
 * Requires `npm run build` beforehand (the tarball ships dist/), and needs
 * npm registry access to resolve the tarball's own dependencies.
 *
 * Usage:
 *   npm run build && npm run test:package
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

async function main() {
  const tmpDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'pag-verify-packaged-install-'),
  );

  try {
    console.log(`Packing package from ${repoRoot}...`);
    const { stdout: packOutput } = await execa(
      'npm',
      ['pack', '--pack-destination', tmpDir, '--json'],
      { cwd: repoRoot },
    );
    const [{ filename }] = JSON.parse(packOutput);
    const tarballPath = path.join(tmpDir, filename);
    console.log(`Packed tarball: ${tarballPath}`);

    const projectDir = path.join(tmpDir, 'consumer');
    await fs.promises.mkdir(projectDir);
    await fs.promises.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(
        { name: 'pag-verify-consumer', version: '0.0.0' },
        null,
        2,
      ),
    );

    console.log('Installing packed tarball with --install-strategy=nested...');
    await execa(
      'npm',
      [
        'install',
        tarballPath,
        '--install-strategy=nested',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
      ],
      { cwd: projectDir, stdio: 'inherit' },
    );

    console.log("Importing 'pwa-asset-generator' as an ES module...");
    const result = await execa(
      'node',
      ['--input-type=module', '-e', "import 'pwa-asset-generator'"],
      { cwd: projectDir, reject: false },
    );

    if (result.exitCode !== 0 || /ERR_MODULE_NOT_FOUND/.test(result.stderr)) {
      console.error(result.stderr);
      throw new Error(
        `Importing pwa-asset-generator failed with exit code ${result.exitCode}`,
      );
    }

    console.log(
      'OK: packaged install imports cleanly under nested install strategy.',
    );
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
