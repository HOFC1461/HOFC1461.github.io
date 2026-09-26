/**
 * The share card.
 *
 * When the address is pasted into LinkedIn, WhatsApp, Slack or a mail client,
 * the crawler reads the tags in <head> and draws a card from them. The image
 * that card needs is 1200x630, absolute, and already cut to that shape -- so
 * it cannot be a screenshot of a phone or a crop of a render.
 *
 * It is made here the same way the PDF is: by serving the site and printing a
 * part of it. The card is the page's own cover, which is the point -- what a
 * recruiter sees in the preview and what opens after the click are the same
 * image, not a poster drawn for the occasion that the site then fails to
 * match.
 *
 *   node tools/og.mjs [--out FILE]
 *
 * Two things are forced that the sheet does not have to force. The hero runs
 * footage, and a still frame is all a card can be, so the poster the <video>
 * already declares is laid in as the background -- which is also what print.css
 * does for paper. And the signature under the title, which only the printed
 * form carries, is turned on: a card with a name on it says whose portfolio
 * this is before anyone reads the line of text beside it.
 *
 * Needs Playwright's Chromium, like tools/pdf.mjs, plus ffmpeg on PATH or at
 * $FFMPEG for the resize down from the 2x capture.
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { createReadStream, promises as fs } from 'node:fs';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'SITE');

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const OUT = resolve(arg('out', join(SITE, 'img/og/share.jpg')));

/* The card, in CSS pixels. Captured at 2x and scaled back down, because type
   this large rasterised at 1x shows its stair-steps at exactly the size the
   card is displayed. */
const CARD = { width: 1200, height: 630 };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2'
};

function serve(dir) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(dir, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile()) throw new Error('not a file');
      res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok({ server, port: server.address().port })));
}

async function main() {
  await fs.mkdir(dirname(OUT), { recursive: true });
  const { server, port } = await serve(SITE);

  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const context = await browser.newContext({
    viewport: CARD, deviceScaleFactor: 2, reducedMotion: 'reduce',
    /* Spanish is the document. The switch is client-side and a crawler never
       throws it, so the card has to be in the language the page answers in. */
    locale: 'es-MX'
  });

  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });

  await page.addStyleTag({ content: `
    .masthead, .progress, .scroll-cue, .langsw{ display: none !important; }
    .hero{
      height: ${CARD.height}px !important; min-height: 0 !important;
      background: var(--paper-deep) url(img/poster/hero-chairs.jpg) center / cover no-repeat;
    }
    .hero__video{ display: none !important; }
    .hero__name{ display: block !important; }
  ` });

  await page.evaluate(() => {
    document.querySelectorAll('[data-fit]').forEach(el => { el.dataset.fit = '1'; });
    if (window.__revealAll) window.__revealAll();
  });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__fitPosters && window.__fitPosters());
  await page.waitForTimeout(600);

  const shot = join(tmpdir(), `og-${process.pid}.png`);
  await page.locator('.hero').screenshot({ path: shot });
  await browser.close();
  server.close();

  const ffmpeg = process.env.FFMPEG || 'ffmpeg';
  execFileSync(ffmpeg, [
    '-y', '-loglevel', 'error', '-i', shot,
    '-vf', `scale=${CARD.width}:${CARD.height}:flags=lanczos`,
    '-q:v', '3', OUT
  ]);
  await fs.rm(shot, { force: true });
  console.log(OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
