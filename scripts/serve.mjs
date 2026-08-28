/* Serve dist/ for local preview. Node only, so the repo needs no Python and no
 * extra dependency just to look at the page.
 *
 *   npm run serve          # builds, then serves on 8000
 *   PORT=3000 npm run serve
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { DIST } from './lib/config.mjs';

const PORT = Number(process.env.PORT ?? 8000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

try {
  await stat(join(DIST, 'index.html'));
} catch {
  console.error('error: dist/index.html not found — run `npm run build` first');
  process.exit(1);
}

createServer(async (req, res) => {
  /* normalize + prefix check keeps a crafted path from escaping dist/ */
  const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const rel = normalize(requested === '/' ? '/index.html' : requested);
  const file = join(DIST, rel);

  if (!file.startsWith(DIST)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }
}).listen(PORT, () => {
  console.log(`  dist/ on http://localhost:${PORT}`);
});
