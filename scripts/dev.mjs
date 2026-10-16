/* Build, serve dist/, and rebuild on every change in src/, reloading the open
 * page when the build succeeds. A failed build prints its error and does not
 * reload, so the tab keeps showing the last page that built.
 *
 *   npm run dev            # http://localhost:8000
 *   PORT=3000 npm run dev
 *
 * The reload client is added to the HTML as it is served, never written into
 * dist/: what this serves is otherwise exactly what deploys.
 */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { SCRIPTS, SRC } from './lib/config.mjs';
import { staticHandler } from './lib/static.mjs';

const PORT = Number(process.env.PORT ?? 8000);
const RELOAD_PATH = '/__reload';
const CLIENT = `<script>new EventSource('${RELOAD_PATH}').onmessage = () => location.reload();</script>`;
/* Editors save in bursts (write, rename, chmod); one build per burst. */
const DEBOUNCE_MS = 80;

const clients = new Set();

/* A child process, so a build that throws or exits cannot take the server down. */
function runBuild() {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(SCRIPTS, 'build.mjs')], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`  built in ${Date.now() - started} ms`);
      } else {
        console.error(`  build failed, page not reloaded\n${output}`);
      }
      resolve(code === 0);
    });
  });
}

let building = false;
let pending = false;

async function rebuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  do {
    pending = false;
    if (await runBuild()) {
      for (const res of clients) res.write('data: reload\n\n');
    }
  } while (pending);
  building = false;
}

await runBuild();

let timer;
watch(SRC, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, DEBOUNCE_MS);
});

const serveFile = staticHandler({
  transformHtml: (html) => html.replace('</body>', `${CLIENT}\n</body>`),
});

createServer((req, res) => {
  if (req.url === RELOAD_PATH) {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  serveFile(req, res);
}).listen(PORT, () => {
  console.log(`  dist/ on http://localhost:${PORT}, rebuilding on changes in src/`);
});
