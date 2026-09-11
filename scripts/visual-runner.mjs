import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';
import { get as httpGet } from 'node:http';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(ROOT, 'tests', 'visual', 'manifest.json');
const BASELINES_DIR = join(ROOT, 'tests', 'visual', 'baselines');
const ARTIFACTS_DIR = join(ROOT, 'tests', 'visual', 'artifacts');
const ACTUAL_DIR = join(ARTIFACTS_DIR, 'actual');
const DIFF_DIR = join(ARTIFACTS_DIR, 'diff');
const REPORTS_DIR = join(ARTIFACTS_DIR, 'reports');
const HOST = process.env.VISUAL_HOST ?? '127.0.0.1';
const PORT = Number(process.env.VISUAL_PORT ?? 4174);
const BASE_URL = (process.env.VISUAL_BASE_URL ?? `http://${HOST}:${PORT}`).replace(/\/$/, '');
const IS_UPDATE = process.argv.includes('--update');
const VIEWPORT = { width: 1440, height: 1200, deviceScaleFactor: 1 };
const MAX_DIFF_PIXEL_RATIO = Number(process.env.VISUAL_MAX_DIFF_RATIO ?? '0.001');
const CHANNEL_THRESHOLD = Number(process.env.VISUAL_CHANNEL_THRESHOLD ?? '0');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

function ensureDirectories() {
  for (const directory of [BASELINES_DIR, ACTUAL_DIR, DIFF_DIR, REPORTS_DIR]) {
    mkdirSync(directory, { recursive: true });
  }
}

function requestPage(url) {
  return new Promise((resolveRequest, reject) => {
    const request = httpGet(url, (response) => {
      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolveRequest({
          statusCode: response.statusCode ?? 0,
          body: chunks.join(''),
        });
      });
    });

    request.on('error', reject);
    request.setTimeout(1000, () => request.destroy(new Error('request timeout')));
  });
}

async function waitForFixtureServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  const fixtureUrl = `${BASE_URL}/tests/visual/fixtures/index.html?scene=pure-dark-button`;

  while (Date.now() < deadline) {
    try {
      const response = await requestPage(fixtureUrl);
      if (response.statusCode === 200 && response.body.includes('Liquid Glass Visual Fixture')) {
        return;
      }
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }

  throw new Error(`Timed out waiting for the visual fixture server at ${BASE_URL}.`);
}

async function ensureFixtureServer() {
  try {
    const response = await requestPage(
      `${BASE_URL}/tests/visual/fixtures/index.html?scene=pure-dark-button`
    );
    if (response.statusCode === 200 && response.body.includes('Liquid Glass Visual Fixture')) {
      return null;
    }
  } catch {
    // Start the dedicated fixture server below.
  }

  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteBin)) throw new Error(`Vite executable not found at ${viteBin}.`);

  const server = spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let serverOutput = '';
  server.stdout?.on('data', (chunk) => {
    serverOutput += String(chunk);
  });
  server.stderr?.on('data', (chunk) => {
    serverOutput += String(chunk);
  });

  try {
    await waitForFixtureServer();
  } catch (error) {
    server.kill();
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${serverOutput}`);
  }

  return server;
}

function findPlaywrightChromium(root) {
  const pending = [root];

  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) continue;

    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(path);
        continue;
      }

      if (
        entry.name === 'chrome' ||
        entry.name === 'chrome.exe' ||
        entry.name === 'Chromium' ||
        entry.name === 'chromium'
      ) {
        return path;
      }
    }
  }

  return null;
}

function findChromeExecutable() {
  const playwrightExecutable = process.env.PLAYWRIGHT_BROWSERS_PATH
    ? findPlaywrightChromium(process.env.PLAYWRIGHT_BROWSERS_PATH)
    : null;

  if (playwrightExecutable) return playwrightExecutable;

  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter((candidate) => candidate);

  const executablePath = candidates.find((candidate) => existsSync(candidate));

  if (executablePath) return executablePath;

  throw new Error(
    'Chrome executable not found. Set CHROME_PATH or PLAYWRIGHT_BROWSERS_PATH to a Chromium installation.'
  );
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodePng(path) {
  const source = readFileSync(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!source.subarray(0, 8).equals(signature)) throw new Error(`Invalid PNG signature: ${path}`);

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];
  let offset = 8;

  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = source.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (width === 0 || height === 0 || bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format in ${path}; expected 8-bit RGB or RGBA.`);
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const decoded = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * 4);
  let previousRow = Buffer.alloc(rowLength);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (rowLength + 1);
    const filterType = decoded[rowStart];
    const filteredRow = decoded.subarray(rowStart + 1, rowStart + 1 + rowLength);
    const row = Buffer.alloc(rowLength);

    for (let index = 0; index < rowLength; index += 1) {
      const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
      const above = previousRow[index] ?? 0;
      const upperLeft = index >= bytesPerPixel ? previousRow[index - bytesPerPixel] : 0;
      let predictor = 0;

      if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = above;
      else if (filterType === 3) predictor = Math.floor((left + above) / 2);
      else if (filterType === 4) predictor = paethPredictor(left, above, upperLeft);
      else if (filterType !== 0)
        throw new Error(`Unsupported PNG filter ${filterType} in ${path}.`);

      row[index] = (filteredRow[index] + predictor) & 0xff;
    }

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = x * bytesPerPixel;
      const targetOffset = (y * width + x) * 4;
      pixels[targetOffset] = row[sourceOffset];
      pixels[targetOffset + 1] = row[sourceOffset + 1];
      pixels[targetOffset + 2] = row[sourceOffset + 2];
      pixels[targetOffset + 3] = colorType === 6 ? row[sourceOffset + 3] : 255;
    }
    previousRow = row;
  }

  return { width, height, pixels };
}

function crc32(source) {
  let crc = 0xffffffff;
  for (const byte of source) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(image) {
  const rowLength = image.width * 4;
  const raw = Buffer.alloc((rowLength + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rowStart = y * (rowLength + 1);
    raw[rowStart] = 0;
    image.pixels.copy(raw, rowStart + 1, y * rowLength, (y + 1) * rowLength);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function comparePng(expected, actual) {
  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `PNG dimensions differ: expected ${expected.width}x${expected.height}, actual ${actual.width}x${actual.height}.`
    );
  }

  const diffImage = Buffer.alloc(actual.pixels.length);
  let diffPixels = 0;
  let maxDelta = 0;

  for (let offset = 0; offset < actual.pixels.length; offset += 4) {
    const delta = Math.max(
      Math.abs(expected.pixels[offset] - actual.pixels[offset]),
      Math.abs(expected.pixels[offset + 1] - actual.pixels[offset + 1]),
      Math.abs(expected.pixels[offset + 2] - actual.pixels[offset + 2]),
      Math.abs(expected.pixels[offset + 3] - actual.pixels[offset + 3])
    );
    maxDelta = Math.max(maxDelta, delta);

    if (delta > CHANNEL_THRESHOLD) {
      diffPixels += 1;
      diffImage[offset] = 255;
      diffImage[offset + 1] = 46;
      diffImage[offset + 2] = 96;
      diffImage[offset + 3] = 255;
    }
  }

  return {
    diffPixels,
    diffRatio: diffPixels / (actual.width * actual.height),
    maxDelta,
    diffImage,
  };
}

function getObservedStatus(element) {
  const statusValues = Array.from(element.querySelectorAll('[data-fixture-status] dd')).map(
    (statusElement) => statusElement.textContent?.trim() ?? null
  );

  return {
    fixtureKey: element.getAttribute('data-visual-fixture'),
    mode: element.getAttribute('data-fixture-mode'),
    phase: element.getAttribute('data-fixture-phase'),
    ready: element.getAttribute('data-fixture-ready'),
    target: statusValues[0] ?? null,
    active: statusValues[1] ?? null,
  };
}

async function runScene(page, scene) {
  const sceneUrl = `${BASE_URL}/tests/visual/fixtures/index.html?scene=${encodeURIComponent(scene.id)}`;
  const selector = `[data-visual-fixture="${scene.fixtureKey}"]`;
  await page.goto(sceneUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector(`${selector}[data-fixture-ready="true"]`, {
    visible: true,
    timeout: 15000,
  });

  const observed = await page.$eval(selector, getObservedStatus);
  const expectedStatus = {
    fixtureKey: scene.fixtureKey,
    mode: scene.mode,
    phase: 'ready',
    ready: 'true',
    target: scene.mode,
    active: scene.mode,
  };

  if (JSON.stringify(observed) !== JSON.stringify(expectedStatus)) {
    throw new Error(
      `Runtime status mismatch for ${scene.id}: expected ${JSON.stringify(expectedStatus)}, observed ${JSON.stringify(observed)}.`
    );
  }

  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  }));
  if (
    viewport.width !== VIEWPORT.width ||
    viewport.height !== VIEWPORT.height ||
    viewport.devicePixelRatio !== VIEWPORT.deviceScaleFactor
  ) {
    throw new Error(`Viewport mismatch: ${JSON.stringify(viewport)}.`);
  }

  const fixture = await page.$(selector);
  if (!fixture) throw new Error(`Fixture element not found for ${scene.id}.`);

  const actualPath = join(ACTUAL_DIR, scene.baseline);
  const diffPath = join(DIFF_DIR, scene.baseline);
  const baselinePath = join(BASELINES_DIR, scene.baseline);
  await fixture.screenshot({ path: actualPath, type: 'png' });

  if (IS_UPDATE) {
    copyFileSync(actualPath, baselinePath);
    return {
      scene: scene.id,
      baseline: scene.baseline,
      status: 'updated',
      observed,
      viewport,
    };
  }

  if (!existsSync(baselinePath)) {
    throw new Error(`Missing baseline ${baselinePath}; run "pnpm run visual:update" explicitly.`);
  }

  const comparison = comparePng(decodePng(baselinePath), decodePng(actualPath));
  writeFileSync(diffPath, encodePng({ ...decodePng(actualPath), pixels: comparison.diffImage }));

  if (comparison.diffRatio > MAX_DIFF_PIXEL_RATIO) {
    throw new Error(
      `Visual diff ${comparison.diffRatio.toFixed(6)} exceeds ${MAX_DIFF_PIXEL_RATIO.toFixed(6)} ` +
        `(${comparison.diffPixels} pixels, max channel delta ${comparison.maxDelta}). ` +
        `See ${diffPath}.`
    );
  }

  return {
    scene: scene.id,
    baseline: scene.baseline,
    status: 'passed',
    diffPixels: comparison.diffPixels,
    diffRatio: comparison.diffRatio,
    maxDelta: comparison.maxDelta,
    observed,
    viewport,
  };
}

async function main() {
  ensureDirectories();
  const fixtureServer = await ensureFixtureServer();
  const browser = await puppeteer.launch({
    executablePath: findChromeExecutable(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.emulateMediaType('screen');
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'prefers-color-scheme', value: 'dark' },
  ]);

  const results = [];
  try {
    for (const scene of manifest) {
      try {
        results.push(await runScene(page, scene));
      } catch (error) {
        results.push({
          scene: scene.id,
          baseline: scene.baseline,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await browser.close();
    fixtureServer?.kill();
  }

  writeFileSync(
    join(REPORTS_DIR, 'latest.json'),
    JSON.stringify(
      {
        mode: IS_UPDATE ? 'update' : 'compare',
        browser: 'chromium',
        viewport: VIEWPORT,
        maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
        channelThreshold: CHANNEL_THRESHOLD,
        results,
      },
      null,
      2
    )
  );

  for (const result of results) {
    if (result.status === 'failed') console.error(`✖ ${result.scene}: ${result.error}`);
    else if (result.status === 'updated') console.log(`↻ ${result.scene}: baseline updated`);
    else console.log(`✔ ${result.scene}: ${result.diffRatio?.toFixed(6) ?? '0.000000'} diff ratio`);
  }

  const failures = results.filter((result) => result.status === 'failed');
  if (failures.length > 0) {
    throw new Error(`${failures.length} visual fixture scene(s) failed.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
