import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ORDINARY_PLAYGROUND_DIRECTORIES = ['components', 'views', 'utils'] as const;
const IMPORT_SPECIFIER_PATTERN =
  /(?:\bfrom\s+|\bimport\s*\(|\brequire\s*\()\s*['"]([^'"]+)['"]/g;
const INTERNAL_SOURCE_PATTERN = /^(?:\.\.\/)+src\/(?:engine|core|vue|parameters|types)(?:\/|$)/;
const DEBUG_DEEP_IMPORT_PATTERN = /^(?:\.\.\/)+debug\/.+/;

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(filePath);
    if (!entry.isFile() || !/\.(?:ts|tsx|vue)$/.test(entry.name)) return [];
    return [filePath];
  });
}

function getImportSpecifiers(source: string): string[] {
  return [...source.matchAll(IMPORT_SPECIFIER_PATTERN)].map((match) => match[1]);
}

function getOrdinaryPlaygroundFiles(): string[] {
  return ORDINARY_PLAYGROUND_DIRECTORIES.flatMap((directory) =>
    collectSourceFiles(resolve('playground', directory))
  );
}

describe('playground import boundary', () => {
  it('keeps ordinary Playground code away from internal source and debug internals', () => {
    const violations: string[] = [];

    for (const filePath of getOrdinaryPlaygroundFiles()) {
      const source = readFileSync(filePath, 'utf8');
      for (const specifier of getImportSpecifiers(source)) {
        const normalizedSpecifier = specifier.replaceAll('\\', '/');
        if (
          INTERNAL_SOURCE_PATTERN.test(normalizedSpecifier) ||
          DEBUG_DEEP_IMPORT_PATTERN.test(normalizedSpecifier)
        ) {
          violations.push(`${relative(process.cwd(), filePath)} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps the explicit debug entry point available to ordinary consumers', () => {
    const controlDrawer = readFileSync(resolve('playground/components/ControlDrawer.vue'), 'utf8');
    const homeShowcase = readFileSync(resolve('playground/views/HomeShowcase.vue'), 'utf8');

    expect(controlDrawer).toContain("from '../debug'");
    expect(homeShowcase).toContain("from '../debug'");
    expect(statSync(resolve('playground/debug/index.ts')).isFile()).toBe(true);
  });
});
