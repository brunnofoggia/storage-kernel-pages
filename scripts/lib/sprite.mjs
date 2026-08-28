/* Fold the official brand SVGs into one inline <symbol> sprite.
 *
 * The marks are third-party trademarks used for identification, so they are kept
 * byte-for-byte from their official sources and stripped only of hardcoded
 * fills, which lets the page recolour them through currentColor.
 *
 * This returns the sprite rather than writing it. The sprite is a build artifact
 * derived from src/assets/logos/, and a build artifact does not belong in the
 * source tree — so the build injects it and nothing on disk can go stale.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SRC } from './config.mjs';

const LOGO_DIR = join(SRC, 'assets', 'logos');

/* Named here rather than read from the file, because <title> is what a screen
 * reader announces and the downloaded marks do not all carry one. */
const TITLES = {
  aws: 'Amazon Web Services',
  github: 'GitHub',
  googlecloud: 'Google Cloud',
  npm: 'npm',
  pypi: 'PyPI',
  python: 'Python',
  typescript: 'TypeScript',
};

async function symbol(file) {
  const slug = file.replace(/\.svg$/, '');
  const source = await readFile(join(LOGO_DIR, file), 'utf8');

  const viewBox = source.match(/viewBox="([^"]+)"/);
  if (!viewBox) throw new Error(`${file} has no viewBox`);

  const paths = [...source.matchAll(/<path[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
  if (!paths.length) throw new Error(`${file} has no path data`);

  const title = TITLES[slug];
  if (!title) throw new Error(`${file}: add a title for "${slug}" to TITLES`);

  const body = paths.map((d) => `<path d="${d}"/>`).join('');
  return `<symbol id="logo-${slug}" viewBox="${viewBox[1]}"><title>${title}</title>${body}</symbol>`;
}

export async function buildSprite() {
  const files = (await readdir(LOGO_DIR)).filter((f) => f.endsWith('.svg')).sort();
  if (!files.length) throw new Error(`no SVGs in ${LOGO_DIR}`);

  const symbols = await Promise.all(files.map(symbol));

  return {
    count: symbols.length,
    markup:
      '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ' +
      'style="position:absolute;width:0;height:0;overflow:hidden">' +
      symbols.join('') + '</svg>',
  };
}
