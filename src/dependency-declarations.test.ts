import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = __dirname;
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

function listTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listTsFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [fullPath] : [];
  });
}

function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]/g,
    /^\s*import\s+['"]([^'"]+)['"]/gm,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function toPackageName(specifier: string): string | null {
  if (specifier.startsWith('.') || specifier.startsWith('node:')) {
    return null;
  }
  const segments = specifier.split('/');
  if (specifier.startsWith('@')) {
    return segments.slice(0, 2).join('/');
  }
  return segments[0];
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
const dependencies: Record<string, string> = packageJson.dependencies ?? {};
const devDependencies: Record<string, string> =
  packageJson.devDependencies ?? {};

describe('dependency declarations', () => {
  for (const filePath of listTsFiles(SRC_DIR)) {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    const isTestFile = filePath.endsWith('.test.ts');
    const source = fs.readFileSync(filePath, 'utf-8');
    const packageNames = Array.from(
      new Set(
        extractImportSpecifiers(source)
          .map(toPackageName)
          .filter((name): name is string => name !== null),
      ),
    );

    for (const packageName of packageNames) {
      test(`${relativePath} declares ${packageName}`, () => {
        const inDependencies = packageName in dependencies;
        const inDevDependencies = packageName in devDependencies;

        if (isTestFile) {
          expect(
            inDependencies || inDevDependencies,
            `${packageName} is imported by ${relativePath} but is not declared in package.json dependencies or devDependencies`,
          ).toBe(true);
        } else {
          expect(
            inDependencies,
            `${packageName} is imported by non-test file ${relativePath} but is not declared in package.json dependencies (found in devDependencies only: ${inDevDependencies})`,
          ).toBe(true);
        }
      });
    }
  }
});
