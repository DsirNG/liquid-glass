import { readdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const packDir = resolve(rootDir, 'temp-pack');
const vanillaDir = resolve(rootDir, 'smoke-test/vanilla');
const vueDir = resolve(rootDir, 'smoke-test/vue');

function run(cmd, cwd = rootDir) {
  console.log(`\n[SmokeTest] > ${cmd} (in ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

async function main() {
  console.log('=== Step 1: Building library distribution ===');
  run('pnpm run build');

  console.log('\n=== Step 2: Packing tarball via pnpm pack ===');
  await rm(packDir, { recursive: true, force: true });
  run(`pnpm pack --pack-destination "${packDir}"`);

  const files = await readdir(packDir);
  const tarballName = files.find((f) => f.endsWith('.tgz'));
  if (!tarballName) {
    throw new Error('No .tgz package tarball found in ' + packDir);
  }
  const tarballPath = join(packDir, tarballName);
  console.log(`[SmokeTest] Target Tarball: ${tarballPath}`);

  console.log('\n=== Step 3: Verifying Vanilla Fixture (ZERO VUE DEPENDENCY) ===');
  run(`pnpm add "${tarballPath}"`, vanillaDir);
  run('pnpm exec tsc --noEmit', vanillaDir);
  run('pnpm exec vite build', vanillaDir);
  console.log('✔ Vanilla fixture PASSED: liquid-glass successfully consumed without Vue installed!');

  console.log('\n=== Step 4: Verifying Vue Fixture ===');
  run(`pnpm add "${tarballPath}"`, vueDir);
  run('pnpm exec vue-tsc -b', vueDir);
  run('pnpm exec vite build', vueDir);
  console.log('✔ Vue fixture PASSED: liquid-glass/vue successfully consumed!');

  console.log('\n=== Step 5: Cleanup temporary artifacts ===');
  await rm(packDir, { recursive: true, force: true });

  console.log('\n🎉 ALL PACKAGE SMOKE TESTS PASSED! Exports, Types, and Bundling 100% verified.');
}

main().catch((err) => {
  console.error('\n❌ SMOKE TEST FAILED:', err);
  process.exit(1);
});
