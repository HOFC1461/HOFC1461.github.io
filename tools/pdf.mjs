/**
 * Portfolio → PDF.
 *
 * The site is the source. This serves SITE/ and prints it with the same engine
 * that renders it, so the file cannot drift from the page: the layout, the
 * typography and the pagination are all decided by site.css and print.css.
 *
 * What the script itself is responsible for is the state the page has to be in
 * before the print: every image downloaded at full size, every reveal resolved,
 * the poster heads measured against the sheet rather than against a window.
 *
 *   node tools/pdf.mjs [--out DIR] [--lang es|en|both] [--only cv] [--light]
 *
 * --only cv prints the short form: the profile and the career sheets alone,
 * which is what a posting asks for when it asks for a curriculum rather than
 * for the work. Same pass, same stylesheet -- print.css drops the rest.
 *
 * --light prints the same document under 2MB, which is what LinkedIn accepts
 * as an attachment. It does not touch the composition: the page is served from
 * a throwaway mirror of SITE/ whose photographs have been re-encoded, so the
 * layout, the pagination and the type are the ones above. See lighten().
 *
 * Needs Playwright's Chromium (npm i -D playwright && npx playwright install
 * chromium), or any Chromium at $CHROMIUM.
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createReadStream, promises as fs } from 'node:fs';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'SITE');

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const OUT = resolve(arg('out', join(ROOT, 'dist')));
const LANGS = (l => (l === 'both' ? ['es', 'en'] : [l]))(arg('lang', 'both'));
const ONLY = arg('only', '');
const LIGHT = argv.includes('--light');

/* The dials --light turns. 1600px is above what any plate here is printed at
   (the widest is the full-bleed band at 1123 CSS px), so the cap costs nothing
   visible; q:v 5 is the knee of the curve for photographs at this size. */
const LIGHT_MAXW = 1600;
const LIGHT_Q = 5;

const FILE = ONLY === 'cv'
  ? { es: 'CV-Hedmon-Cervantes-ES.pdf', en: 'CV-Hedmon-Cervantes-EN.pdf' }
  : { es: 'Portafolio-Hedmon-Cervantes-ES.pdf', en: 'Portfolio-Hedmon-Cervantes-EN.pdf' };
const suffix = f => LIGHT ? f.replace(/\.pdf$/, '-web.pdf') : f;

/* The sheet, in CSS pixels: A4 landscape (297mm) by the content height left
   between the page margins print.css sets. The viewport is set to the same
   figures so that anything the page measures for itself — the poster heads are
   solved from the width they have to fill — is measured against the paper. */
const PAGE = { width: 1123, height: 718 };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
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

/**
 * A throwaway copy of SITE/ whose photographs weigh less.
 *
 * Nothing about the composition is touched, because nothing here is read by
 * the stylesheet: the page is served from this folder instead of SITE/ and
 * finds every file where it expects it, only smaller. Two jobs:
 *
 * 1. Every JPEG is capped at LIGHT_MAXW and re-encoded. The icons are left
 *    alone -- they are PNG masks, a few kilobytes each, and a lossy pass over
 *    an alpha channel is how a mask turns to mud.
 *
 * 2. The portrait is converted to grey here instead of in the browser. That is
 *    the whole reason this mode exists: `filter: grayscale()` makes Chromium
 *    rasterise the photograph itself and embed the result losslessly, at twice
 *    the layout size -- 1.27MB of PNG for one picture, a third of the file. Baked
 *    in the file, the filter has nothing left to do (print.css is told to drop
 *    it) and the same photograph rides along as a 150KB JPEG.
 */
async function lighten(src) {
  const dir = await fs.mkdtemp(join(tmpdir(), 'portafolio-'));
  await fs.cp(src, dir, { recursive: true });

  const ffmpeg = process.env.FFMPEG || 'ffmpeg';
  const run = args => execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...args]);

  const jpegs = [];
  const walk = async d => {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'icon' && e.name !== 'og') await walk(p); }
      else if (/\.jpe?g$/i.test(e.name)) jpegs.push(p);
    }
  };
  await walk(join(dir, 'img'));

  for (const file of jpegs) {
    /* -update 1 because a single still read and written through ffmpeg is a
       one-frame video as far as it is concerned. */
    const grey = /[/\\]profile[/\\]/.test(file);
    const vf = [`scale='min(${LIGHT_MAXW},iw)':-2`, grey ? 'format=gray,eq=contrast=1.04' : null]
      .filter(Boolean).join(',');
    const tmp = file + '.tmp.jpg';
    run(['-i', file, '-vf', vf, '-q:v', String(LIGHT_Q), '-update', '1', tmp]);
    await fs.rename(tmp, file);
  }

  const before = await weigh(src), after = await weigh(dir);
  console.log(`  ${jpegs.length} fotografías: ${(before / 1e6).toFixed(2)}MB -> ${(after / 1e6).toFixed(2)}MB`);
  return dir;
}

async function weigh(dir) {
  let total = 0;
  const walk = async d => {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else total += (await fs.stat(p)).size;
    }
  };
  await walk(join(dir, 'img'));
  return total;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const root = LIGHT ? await lighten(SITE) : SITE;
  const { server, port } = await serve(root);

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM || undefined,
    args: ['--font-render-hinting=none', '--allow-file-access-from-files']
  });

  /* Reduced motion is the honest way to freeze the page: the site already
     treats it as a first-class state — the motion layer stands down and the
     stylesheet publishes every reveal in its end position — so the print gets
     the finished page rather than one caught mid-animation. */
  const context = await browser.newContext({
    viewport: PAGE, deviceScaleFactor: LIGHT ? 1 : 2, reducedMotion: 'reduce',
    locale: 'es-MX'
  });

  for (const lang of LANGS) {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });

    if (lang === 'en') {
      await page.click('.langsw__b[data-lang="en"]');
      await page.waitForFunction(() => document.documentElement.lang === 'en');
    }

    /* Print media first, then the page's own measuring pass: the poster heads
       have to be solved with the print gutter in force, or they are set to the
       width of a window that is not the sheet. */
    await page.emulateMedia({ media: 'print' });

    /* The cut is made in the stylesheet, not here: this only says which
       document is being printed. */
    if (ONLY) await page.evaluate(only => { document.documentElement.dataset.print = only; }, ONLY);
    if (LIGHT) await page.addStyleTag({ content: '.portrait{ filter: none !important; }' });

    /* srcset picks the variant that suits a screen at this width; on paper the
       original is the one worth carrying. Lazy images never load at all unless
       they are scrolled to, which in a single print pass they never are. */
    await page.evaluate(() => {
      document.querySelectorAll('img').forEach(img => {
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.loading = 'eager';
        img.decoding = 'sync';
      });
      /* The heads are set to 104% of the measure on screen, where running a
         little past the gutter reads as a poster. On a sheet with no bleed it
         reads as a word that did not fit, so here they are set to the measure
         exactly. */
      document.querySelectorAll('[data-fit]').forEach(el => { el.dataset.fit = '1'; });
      if (window.__revealAll) window.__revealAll();
    });

    await page.waitForFunction(
      () => Array.from(document.images).every(i => i.complete && i.naturalWidth > 0),
      null, { timeout: 120000 }
    );
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.__fitPosters && window.__fitPosters());
    await page.waitForTimeout(300);

    const out = join(OUT, suffix(FILE[lang]));
    await page.pdf({
      path: out,
      printBackground: true,
      preferCSSPageSize: true,       // @page in print.css owns size and margins
      displayHeaderFooter: false,
      tagged: true,                  // a real document outline, not a picture of one
      outline: false
    });
    await page.close();
    console.log(`${out}  ${((await fs.stat(out)).size / 1e6).toFixed(2)}MB`);
  }

  await browser.close();
  server.close();
  if (root !== SITE) await fs.rm(root, { recursive: true, force: true });
}

main().catch(e => { console.error(e); process.exit(1); });
