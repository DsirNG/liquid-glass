import puppeteer from 'puppeteer-core';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });

  // Allow animations, canvas, and SVG to render
  await new Promise((r) => setTimeout(r, 2500));

  const targetPath = 'C:/Users/Administrator/.gemini/antigravity/brain/28602a61-3a8a-4d5e-b20c-9b29677bddb8/lab_showcase.png';
  await page.screenshot({ path: targetPath, type: 'png' });

  console.log('Screenshot saved to:', targetPath);
  await browser.close();
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
