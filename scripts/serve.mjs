/* Serve dist/ for local preview. Node only, so the repo needs no Python and no
 * extra dependency just to look at the page.
 *
 *   npm run serve          # serves an existing build on 8000
 *   PORT=3000 npm run serve
 *
 * To rebuild and reload on every change in src/, use `npm run dev`.
 */
import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from './lib/config.mjs';
import { staticHandler } from './lib/static.mjs';

const PORT = Number(process.env.PORT ?? 8000);

try {
  await stat(join(DIST, 'index.html'));
} catch {
  console.error('error: dist/index.html not found — run `npm run build` first');
  process.exit(1);
}

createServer(staticHandler()).listen(PORT, () => {
  console.log(`  dist/ on http://localhost:${PORT}`);
});
