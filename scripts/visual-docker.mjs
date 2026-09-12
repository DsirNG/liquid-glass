import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE = process.env.VISUAL_DOCKER_IMAGE ?? 'mcr.microsoft.com/playwright:v1.55.0-noble';
const PNPM_VERSION = '11.20.0';
const IS_UPDATE = process.argv.includes('--update');
const visualScript = IS_UPDATE ? 'visual:update' : 'visual:test';
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';

const dockerArgs = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '--env',
  'CI=true',
  '--env',
  'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
  '--env',
  `VISUAL_MAX_DIFF_RATIO=${process.env.VISUAL_MAX_DIFF_RATIO ?? '0.001'}`,
  '--volume',
  `${ROOT}:/workspace`,
  '--tmpfs',
  '/workspace/node_modules',
  '--workdir',
  '/workspace',
  IMAGE,
  'bash',
  '-lc',
  `corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate && ` +
    `pnpm install --frozen-lockfile && pnpm run ${visualScript}`,
];

const result = spawnSync(dockerCommand, dockerArgs, {
  cwd: ROOT,
  stdio: 'inherit',
  windowsHide: true,
});

if (result.error) {
  console.error(
    `Unable to run the canonical visual environment. Is Docker Desktop running? ${result.error.message}`
  );
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
