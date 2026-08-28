/* Build src/ into dist/ — the artifact that ships to GitHub Pages.
 *
 * dist/ is not a copy of src/. Everything here is a reason the step exists:
 *
 * 1. The brand-mark sprite is generated from src/assets/logos/ and injected. It
 *    is a build artifact, so it exists only here — neither inline in
 *    src/index.html nor as a generated file committed beside the source.
 * 2. styles.css and app.js get a content hash in their filename, so Pages can
 *    serve them with a long cache lifetime and still update instantly.
 * 3. .nojekyll is written, without which Pages runs the files through Jekyll.
 * 4. With a custom domain configured in site.config.json: CNAME, the canonical
 *    link, og:url, robots.txt and sitemap.xml. Without one, the build says so
 *    and skips them, which is fine for local preview and refused by deploy.
 *
 * Nothing is minified: ~66 KB of HTML, and gzip on the wire does most of what a
 * minifier would for none of the toolchain.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { DIST, SRC, ROOT } from './lib/config.mjs';
import { readSite } from './lib/site.mjs';
import { buildSprite } from './lib/sprite.mjs';

const HASHED = ['styles.css', 'app.js'];
const SPRITE_MARK = '<!--LOGO_SPRITE-->';
const CANONICAL_MARK = '<!--CANONICAL-->';

/* Stamped into sitemap.xml. Taken from the newest source file rather than the
 * clock, so two builds of the same input produce the same dist/. */
async function sourceMtime() {
  let newest = 0;
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else newest = Math.max(newest, (await stat(full)).mtimeMs);
    }
  };
  await walk(SRC);
  return new Date(newest).toISOString().slice(0, 10);
}

const shortHash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

async function build() {
  const site = await readSite();

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  let html = await readFile(join(SRC, 'index.html'), 'utf8');

  /* --- sprite --------------------------------------------------------- */
  if (!html.includes(SPRITE_MARK)) {
    throw new Error(`src/index.html has no ${SPRITE_MARK} to inject the sprite into`);
  }
  const sprite = await buildSprite();
  html = html.replace(SPRITE_MARK, sprite.markup);
  console.log(`  sprite      ${sprite.count} brand marks, ${Buffer.byteLength(sprite.markup)} bytes`);

  /* --- hashed assets -------------------------------------------------- */
  for (const name of HASHED) {
    const raw = await readFile(join(SRC, name));
    const dot = name.lastIndexOf('.');
    const hashed = `${name.slice(0, dot)}.${shortHash(raw)}${name.slice(dot)}`;

    await writeFile(join(DIST, hashed), raw);

    if (!html.includes(`"${name}"`)) {
      throw new Error(`src/index.html does not reference ${name}`);
    }
    html = html.replaceAll(`"${name}"`, `"${hashed}"`);
    console.log(`  ${name} -> ${hashed}`);
  }

  /* --- canonical, only meaningful with a real origin ------------------- */
  if (!html.includes(CANONICAL_MARK)) {
    throw new Error(`src/index.html has no ${CANONICAL_MARK}`);
  }
  html = html.replace(CANONICAL_MARK, site.configured
    ? `<link rel="canonical" href="${site.origin}/">\n` +
      `<meta property="og:url" content="${site.origin}/">`
    : '');

  await writeFile(join(DIST, 'index.html'), html, 'utf8');
  console.log(`  index.html  (${Math.round(Buffer.byteLength(html) / 1024)} KB, sprite inlined)`);

  /* --- Pages plumbing ------------------------------------------------- */
  await writeFile(join(DIST, '.nojekyll'), '', 'utf8');

  if (site.configured) {
    /* Pages reads the custom domain from this file in the published artifact.
     * Without it, a deploy silently reverts the domain to <user>.github.io. */
    await writeFile(join(DIST, 'CNAME'), `${site.host}\n`, 'utf8');
    console.log(`  CNAME       ${site.host}`);

    await writeFile(join(DIST, 'robots.txt'),
      `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`, 'utf8');

    await writeFile(join(DIST, 'sitemap.xml'),
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      `  <url><loc>${site.origin}/</loc><lastmod>${await sourceMtime()}</lastmod></url>\n` +
      '</urlset>\n', 'utf8');
    console.log('  robots.txt, sitemap.xml');
  } else {
    console.log('\n  site.config.json has no "url": built for local preview.');
    console.log('  No CNAME, canonical, robots.txt or sitemap.xml — deploy will refuse.');
  }

  /* The logo SVGs are the sprite's source, not a runtime dependency: the built
   * page references none of them, so they stay out of dist/. */
  const built = await readFile(join(DIST, 'index.html'), 'utf8');
  for (const mark of [SPRITE_MARK, CANONICAL_MARK]) {
    if (built.includes(mark)) throw new Error(`${mark} survived the build`);
  }

  const files = [];
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else files.push([relative(ROOT, full), (await stat(full)).size]);
    }
  };
  await walk(DIST);
  const total = files.reduce((n, [, size]) => n + size, 0);
  console.log(`\n  dist/ — ${files.length} files, ${Math.round(total / 1024)} KB`);
}

try {
  await build();
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
