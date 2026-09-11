import { execSync } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const rootDir = process.cwd();
const packDir = resolve(rootDir, 'temp-pack');
const fixtureSourceDir = resolve(rootDir, 'smoke-test');

let smokeRootDir;

function run(cmd, cwd = rootDir) {
  console.log(`\n[SmokeTest] > ${cmd} (in ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

async function prepareFixture(name) {
  const sourceDir = join(fixtureSourceDir, name);
  const targetDir = join(smokeRootDir, name);

  await cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) => {
      const entryName = basename(source);
      return entryName !== 'node_modules' &&
        entryName !== 'dist';
    },
  });

  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(
    await readFile(packageJsonPath, 'utf8'),
  );

  for (const dependencySection of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    delete packageJson[dependencySection]?.['liquid-glass'];
    delete packageJson[dependencySection]?.['@dinqorai/liquid-glass'];
  }

  await writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  return targetDir;
}

async function main() {
  try {
    console.log('=== Step 1: Building library distribution ===');
    run('pnpm run build');

    console.log('\n=== Step 2: Packing tarball via pnpm pack ===');
    await rm(packDir, { recursive: true, force: true });
    run(`pnpm pack --pack-destination "${packDir}"`);

    const files = await readdir(packDir);
    const tarballName = files.find((file) => file.endsWith('.tgz'));
    if (!tarballName) {
      throw new Error('No .tgz package tarball found in ' + packDir);
    }
    const tarballPath = join(packDir, tarballName);
    console.log(`[SmokeTest] Target Tarball: ${tarballPath}`);

    smokeRootDir = await mkdtemp(join(tmpdir(), 'liquid-glass-smoke-'));
    const vanillaDir = await prepareFixture('vanilla');
    const vueDir = await prepareFixture('vue');

    console.log('\n=== Step 3: Verifying Vanilla Fixture (ZERO VUE DEPENDENCY) ===');
    run(`pnpm add "${tarballPath}"`, vanillaDir);
    run('pnpm exec tsc --noEmit', vanillaDir);
    run('pnpm exec vite build', vanillaDir);
    console.log('✅ Vanilla fixture PASSED: liquid-glass successfully consumed without Vue installed!');

    console.log('\n=== Step 4: Verifying Vue Fixture ===');
    run(`pnpm add "${tarballPath}"`, vueDir);
    run('pnpm exec vue-tsc -b', vueDir);
    run('pnpm exec vite build', vueDir);
    console.log('✅ Vue fixture PASSED: liquid-glass/vue successfully consumed!');

    console.log('\n🎉 ALL PACKAGE SMOKE TESTS PASSED! Exports, Types, and Bundling 100% verified.');
  } finally {
    console.log('\n=== Step 5: Cleanup temporary artifacts ===');
    await Promise.all([
      rm(packDir, { recursive: true, force: true }),
      smokeRootDir
        ? rm(smokeRootDir, { recursive: true, force: true })
        : Promise.resolve(),
    ]);
  }
}

main().catch((err) => {
  console.error('\n❌ SMOKE TEST FAILED:', err);
  process.exit(1);
});
