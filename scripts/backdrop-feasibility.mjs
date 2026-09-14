import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { get as httpGet } from 'node:http';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = process.env.BACKDROP_FEASIBILITY_HOST ?? '127.0.0.1';
const PORT = Number(process.env.BACKDROP_FEASIBILITY_PORT ?? 4175);
const BASE_URL = (process.env.BACKDROP_FEASIBILITY_BASE_URL ?? `http://${HOST}:${PORT}`).replace(
  /\/$/,
  ''
);
const ARTIFACT_DIR = join(ROOT, 'tests', 'visual', 'artifacts', 'backdrop-feasibility');
const SCENES = ['split-background', 'dynamic-background', 'moving-background'];
const VIEWPORT = { width: 800, height: 500, deviceScaleFactor: 1 };

mkdirSync(ARTIFACT_DIR, { recursive: true });

const wait = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

function requestPage(url) {
  return new Promise((resolveRequest, reject) => {
    const request = httpGet(url, (response) => {
      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolveRequest({ statusCode: response.statusCode ?? 0, body: chunks.join('') });
      });
    });
    request.on('error', reject);
    request.setTimeout(1000, () => request.destroy(new Error('request timeout')));
  });
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  const url = `${BASE_URL}/tests/backdrop-feasibility/index.html?scene=split-background`;
  while (Date.now() < deadline) {
    try {
      const response = await requestPage(url);
      if (response.statusCode === 200 && response.body.includes('Adaptive Backdrop Feasibility')) {
        return;
      }
    } catch {
      // Vite may still be starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Timed out waiting for ${BASE_URL}.`);
}

async function startServer() {
  try {
    const response = await requestPage(
      `${BASE_URL}/tests/backdrop-feasibility/index.html?scene=split-background`
    );
    if (response.statusCode === 200 && response.body.includes('Adaptive Backdrop Feasibility')) {
      return null;
    }
  } catch {
    // Start a dedicated fixture server below.
  }

  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteBin)) throw new Error(`Vite executable not found at ${viteBin}.`);
  const server = spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let output = '';
  server.stdout?.on('data', (chunk) => (output += String(chunk)));
  server.stderr?.on('data', (chunk) => (output += String(chunk)));

  try {
    await waitForServer();
  } catch (error) {
    server.kill();
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${output}`, {
      cause: error,
    });
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
      if (entry.isDirectory()) pending.push(path);
      else if (['chrome', 'chrome.exe', 'chromium', 'Chromium'].includes(entry.name)) return path;
    }
  }
  return null;
}

function findChromeExecutable() {
  const browserRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  const playwrightExecutable = browserRoot ? findPlaywrightChromium(browserRoot) : null;
  if (playwrightExecutable) return playwrightExecutable;
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) throw new Error('Chrome executable not found. Set CHROME_PATH.');
  return executable;
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distances = [
    [Math.abs(estimate - left), left],
    [Math.abs(estimate - above), above],
    [Math.abs(estimate - upperLeft), upperLeft],
  ];
  distances.sort((a, b) => a[0] - b[0]);
  return distances[0][1];
}

function decodePng(path) {
  const source = readFileSync(path);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
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
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format in ${path}.`);
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const decoded = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * 4);
  let previousRow = Buffer.alloc(rowLength);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (rowLength + 1);
    const filterType = decoded[rowStart];
    const filtered = decoded.subarray(rowStart + 1, rowStart + 1 + rowLength);
    const row = Buffer.alloc(rowLength);
    for (let index = 0; index < rowLength; index += 1) {
      const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
      const above = previousRow[index] ?? 0;
      const upperLeft = index >= bytesPerPixel ? previousRow[index - bytesPerPixel] : 0;
      let predictor = 0;
      if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = above;
      else if (filterType === 3) predictor = Math.floor((left + above) / 2);
      else if (filterType === 4) predictor = paeth(left, above, upperLeft);
      else if (filterType !== 0) throw new Error(`Unsupported PNG filter ${filterType}.`);
      row[index] = (filtered[index] + predictor) & 0xff;
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

function lumaAt(image, x, y) {
  const offset = (y * image.width + x) * 4;
  return (
    image.pixels[offset] * 0.2126 +
    image.pixels[offset + 1] * 0.7152 +
    image.pixels[offset + 2] * 0.0722
  );
}

function averageLuma(image, x0, x1, y0 = 0, y1 = image.height) {
  let total = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      total += lumaAt(image, x, y);
      count += 1;
    }
  }
  return total / Math.max(1, count);
}

function windowLuma(image, center, radius = 20) {
  return averageLuma(
    image,
    Math.max(0, center - radius),
    Math.min(image.width, center + radius),
    Math.floor(image.height * 0.3),
    Math.ceil(image.height * 0.7)
  );
}

function rowProfile(image) {
  const y = Math.floor(image.height / 2);
  return Array.from({ length: image.width }, (_, x) => lumaAt(image, x, y));
}

function peakIndex(profile) {
  return profile.reduce((peak, value, index) => (value > profile[peak] ? index : peak), 0);
}

async function runScene(page, scene) {
  await page.goto(
    `${BASE_URL}/tests/backdrop-feasibility/index.html?scene=${encodeURIComponent(scene)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }
  );
  await page.waitForSelector('.feasibility-fixture[data-ready="true"]', {
    visible: true,
    timeout: 15000,
  });
  const before = await page.evaluate(() => window.__backdropFeasibility);
  if (!before) throw new Error(`Fixture state missing for ${scene}.`);
  if (before.status.activeMode !== 'full-optical') {
    throw new Error(`Expected full-optical runtime, received ${JSON.stringify(before.status)}.`);
  }

  const initialPath = join(ARTIFACT_DIR, `${scene}-initial.png`);
  const signal = await page.$('[data-feasibility-signal]');
  if (!signal) throw new Error(`Signal element missing for ${scene}.`);
  await signal.screenshot({ path: initialPath, type: 'png' });
  const initialImage = decodePng(initialPath);
  const result = { scene, initialPath, before };

  if (scene === 'split-background') {
    const profile = rowProfile(initialImage);
    const center = averageLuma(initialImage, 160, 200, 60, 120);
    const side = Math.max(
      averageLuma(initialImage, 20, 80, 60, 120),
      averageLuma(initialImage, 280, 340, 60, 120)
    );
    result.signalPeak = peakIndex(profile);
    result.centerLuma = center;
    result.sideLuma = side;
    if (center <= side + 8) {
      throw new Error(
        `Split backdrop signal was not localized at the boundary: ${JSON.stringify(result)}`
      );
    }
  } else if (scene === 'dynamic-background') {
    await page.evaluate(() => window.__backdropFeasibility?.setDynamicBackground('light'));
    await wait(250);
    const lightPath = join(ARTIFACT_DIR, `${scene}-light.png`);
    await signal.screenshot({ path: lightPath, type: 'png' });
    const lightImage = decodePng(lightPath);
    const darkLuma = averageLuma(initialImage, 0, initialImage.width);
    const lightLuma = averageLuma(lightImage, 0, lightImage.width);
    result.lightPath = lightPath;
    result.darkLuma = darkLuma;
    result.lightLuma = lightLuma;
    if (Math.abs(lightLuma - darkLuma) <= 20) {
      throw new Error(`Dynamic backdrop luma did not update: ${JSON.stringify(result)}`);
    }
  } else {
    await page.evaluate(() => window.__backdropFeasibility?.setMovingPosition(65));
    await wait(250);
    const movedPath = join(ARTIFACT_DIR, `${scene}-moved.png`);
    await signal.screenshot({ path: movedPath, type: 'png' });
    const movedImage = decodePng(movedPath);
    const initialPeak = peakIndex(rowProfile(initialImage));
    const movedPeak = peakIndex(rowProfile(movedImage));
    const initialExpected = windowLuma(initialImage, 60);
    const initialOpposite = windowLuma(initialImage, 300);
    const movedExpected = windowLuma(movedImage, 300);
    const movedOpposite = windowLuma(movedImage, 60);
    result.movedPath = movedPath;
    result.initialPeak = initialPeak;
    result.movedPeak = movedPeak;
    result.initialExpected = initialExpected;
    result.initialOpposite = initialOpposite;
    result.movedExpected = movedExpected;
    result.movedOpposite = movedOpposite;
    if (initialExpected <= initialOpposite + 8 || movedExpected <= movedOpposite + 8) {
      throw new Error(`Moving backdrop signal did not follow the split: ${JSON.stringify(result)}`);
    }
  }

  await wait(100);
  const after = await page.evaluate(() => window.__backdropFeasibility);
  if (!after) throw new Error(`Fixture state disappeared for ${scene}.`);
  result.after = after;
  if (
    after.runtimeInstanceCount !== 1 ||
    after.fieldGenerationCount !== before.fieldGenerationCount ||
    after.runtimeFilterId !== before.runtimeFilterId ||
    after.runtimeFilterSignature !== before.runtimeFilterSignature ||
    after.runtimeFilterMutationCount !== before.runtimeFilterMutationCount ||
    JSON.stringify(after.status) !== JSON.stringify(before.status)
  ) {
    throw new Error(`Runtime changed while only the backdrop changed: ${JSON.stringify(result)}`);
  }
  return result;
}

async function main() {
  const server = await startServer();
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
    for (const scene of SCENES) results.push(await runScene(page, scene));
  } finally {
    await browser.close();
    server?.kill();
  }
  const reportPath = join(ARTIFACT_DIR, 'latest.json');
  writeFileSync(reportPath, JSON.stringify({ viewport: VIEWPORT, results }, null, 2));
  for (const result of results) console.log(`✔ ${result.scene}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
