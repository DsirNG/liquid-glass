import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { firefox, webkit } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = process.env.RUNTIME_MATRIX_HOST ?? '127.0.0.1';
const PORT = Number(process.env.RUNTIME_MATRIX_PORT ?? 4175);
const BASE_URL = (process.env.RUNTIME_MATRIX_BASE_URL ?? `http://${HOST}:${PORT}`).replace(
  /\/$/,
  ''
);
const ARTIFACTS_DIR = join(ROOT, 'tests', 'runtime-matrix', 'artifacts');
const requestedBrowser = process.argv
  .find((argument) => argument.startsWith('--browser='))
  ?.split('=')[1];
const browsers = requestedBrowser ? [requestedBrowser] : ['firefox', 'webkit'];
const supportedBrowsers = new Map([
  ['firefox', firefox],
  ['webkit', webkit],
]);

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  const url = `${BASE_URL}/tests/runtime-matrix/index.html`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok && (await response.text()).includes('Liquid Glass Runtime Matrix')) return;
    } catch {
      // Vite may still be starting.
    }
    await sleep(100);
  }

  throw new Error(`Timed out waiting for the runtime matrix fixture at ${BASE_URL}.`);
}

function startFixtureServer() {
  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteBin)) throw new Error(`Vite executable not found at ${viteBin}.`);

  const server = spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let output = '';
  server.stdout?.on('data', (chunk) => {
    output += String(chunk);
  });
  server.stderr?.on('data', (chunk) => {
    output += String(chunk);
  });

  return { server, getOutput: () => output };
}

function assertSnapshot(browserName, snapshot) {
  const validModes = ['full-optical', 'material', 'static'];
  const { plan, status, capabilityReport: report } = snapshot;

  if (!validModes.includes(plan.targetMode)) {
    throw new Error(`${browserName}: planner returned an invalid target mode.`);
  }
  if (status.phase !== 'ready') {
    throw new Error(`${browserName}: runtime did not reach ready phase: ${status.phase}.`);
  }
  if (status.targetMode !== plan.targetMode || status.activeMode !== plan.targetMode) {
    throw new Error(
      `${browserName}: planner/runtime mismatch: plan=${plan.targetMode}, ` +
        `target=${status.targetMode}, active=${status.activeMode}.`
    );
  }
  if (status.degraded !== plan.degraded) {
    throw new Error(
      `${browserName}: degraded state mismatch: plan=${plan.degraded}, status=${status.degraded}.`
    );
  }
  if ((status.degradationReason !== undefined) !== plan.degraded) {
    throw new Error(`${browserName}: degradation reason does not match the selected plan.`);
  }
  if (status.recoveryMode !== undefined) {
    throw new Error(`${browserName}: unexpected recovery mode for a committed target backend.`);
  }
  if (
    report.svgBackdropDisplacement !==
    (report.backdropFilter && report.svgFilter && report.svgDisplacementMap)
  ) {
    throw new Error(`${browserName}: capability report combination is inconsistent.`);
  }
  if (
    browserName === 'webkit' &&
    !report.knownRestrictions.includes('webkit-svg-backdrop-displacement')
  ) {
    throw new Error('webkit: expected the known SVG backdrop displacement restriction.');
  }
  if (browserName === 'firefox' && report.knownRestrictions.length !== 0) {
    throw new Error(
      `firefox: unexpected known restrictions: ${report.knownRestrictions.join(', ')}.`
    );
  }
}

async function runBrowser(browserName, browserType) {
  const browser = await browserType.launch({ headless: true });
  const pageErrors = [];
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${BASE_URL}/tests/runtime-matrix/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => window.__LIQUID_GLASS_RUNTIME_MATRIX__?.getSnapshot().status.phase === 'ready',
      undefined,
      { timeout: 15000 }
    );
    const snapshot = await page.evaluate(() =>
      window.__LIQUID_GLASS_RUNTIME_MATRIX__?.getSnapshot()
    );
    if (!snapshot) throw new Error(`${browserName}: runtime matrix hook was not installed.`);
    if (pageErrors.length > 0) throw new Error(`${browserName}: ${pageErrors.join('; ')}`);

    assertSnapshot(browserName, snapshot);
    const result = {
      browser: browserName,
      browserVersion: browser.version(),
      userAgent: await page.evaluate(() => navigator.userAgent),
      ...snapshot,
    };
    mkdirSync(ARTIFACTS_DIR, { recursive: true });
    writeFileSync(join(ARTIFACTS_DIR, `${browserName}.json`), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

async function main() {
  const invalidBrowser = browsers.find((browserName) => !supportedBrowsers.has(browserName));
  if (invalidBrowser) throw new Error(`Unsupported runtime matrix browser: ${invalidBrowser}.`);

  const fixtureServer = startFixtureServer();
  try {
    await waitForServer();
    for (const browserName of browsers) {
      await runBrowser(browserName, supportedBrowsers.get(browserName));
    }
  } catch (error) {
    const serverOutput = fixtureServer.getOutput();
    if (serverOutput) console.error(serverOutput);
    throw error;
  } finally {
    fixtureServer.server.kill();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
