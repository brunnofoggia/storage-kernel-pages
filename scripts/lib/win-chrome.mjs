/* Driving the Windows Chrome that WSL can reach.
 *
 * Used by verify-local.mjs and shots.mjs. It exists because Playwright's
 * chrome-headless-shell will not start on this box (libnspr4.so and libnss3 are
 * missing) and Chrome's remote-debugging port is unreachable across the WSL2
 * network boundary, so there is no CDP either — only the command line.
 */
import { execFile } from 'node:child_process';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { accessSync, constants, existsSync, readdirSync } from 'node:fs';
import { promisify } from 'node:util';
import { join } from 'node:path';

const run = promisify(execFile);

export const CHROME = process.env.SK_CHROME
  ?? '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';

/* Chrome runs on the Windows side, so it cannot read \\wsl$ paths reliably.
 * Everything it needs is staged in a Windows-visible temp directory. */
function detectWinTemp() {
  if (process.env.SK_WIN_TEMP) return process.env.SK_WIN_TEMP;

  const users = '/mnt/c/Users';
  if (!existsSync(users)) return null;

  /* Writability is the property we need, so test it rather than guessing at
   * profile names: Windows ships junctions like "Default User" whose name is
   * localised ("Usuário Padrão" here), and a name-based skip list misses them. */
  const writable = (dir) => {
    try {
      accessSync(dir, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  };

  const candidates = [];
  for (const entry of readdirSync(users, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(users, entry.name, 'AppData', 'Local', 'Temp');
    if (existsSync(dir) && writable(dir)) candidates.push([entry.name, dir]);
  }
  if (!candidates.length) return null;

  /* Prefer the profile matching the WSL user, so the choice is stable on a box
   * with more than one writable profile. */
  const me = (process.env.USER ?? '').toLowerCase();
  const mine = candidates.find(([name]) => name.toLowerCase() === me);
  return (mine ?? candidates[0])[1];
}

const WIN_TEMP = detectWinTemp();

export function assertUsable() {
  if (!existsSync(CHROME)) {
    throw new Error(
      `Windows Chrome not found at ${CHROME}.\n` +
      '  Set SK_CHROME to its path, or run the Playwright harness instead:\n' +
      '    npm run verify',
    );
  }
  if (!WIN_TEMP) {
    throw new Error(
      'Could not find a Windows temp directory under /mnt/c/Users/*/AppData/Local/Temp.\n' +
      '  Set SK_WIN_TEMP to a Windows-visible directory.',
    );
  }
}

function toWindowsPath(wslPath) {
  const m = wslPath.match(/^\/mnt\/([a-z])\/(.*)$/);
  if (!m) throw new Error(`not a /mnt/<drive> path: ${wslPath}`);
  return `${m[1].toUpperCase()}:\\${m[2].replaceAll('/', '\\')}`;
}

function toFileUrl(wslPath) {
  const m = wslPath.match(/^\/mnt\/([a-z])\/(.*)$/);
  if (!m) throw new Error(`not a /mnt/<drive> path: ${wslPath}`);
  return `file:///${m[1].toUpperCase()}:/${m[2]}`;
}

/** Stage a directory's contents where Windows Chrome can read them. */
export async function stage(name, fromDir) {
  assertUsable();
  const dir = join(WIN_TEMP, name);
  await mkdir(dir, { recursive: true });
  if (fromDir) await cp(fromDir, dir, { recursive: true });
  return {
    dir,
    url: (file) => toFileUrl(join(dir, file)),
    winPath: (file) => toWindowsPath(join(dir, file)),
    write: (file, content) => writeFile(join(dir, file), content, 'utf8'),
  };
}

const BASE_FLAGS = [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--force-device-scale-factor=1',
];

/** Load a URL, let scripts settle, and return the resulting DOM. */
export async function dumpDom(url, { width, height = 1050, budgetMs = 11000 } = {}) {
  const { stdout } = await run(CHROME, [
    ...BASE_FLAGS,
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${budgetMs}`,
    '--dump-dom',
    url,
  ], { maxBuffer: 64 * 1024 * 1024, timeout: budgetMs + 60000 });
  return stdout;
}

/** Screenshot a URL to a Windows path. */
export async function screenshot(url, winOutPath, { width, height, budgetMs = 9000 } = {}) {
  await run(CHROME, [
    ...BASE_FLAGS,
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${budgetMs}`,
    `--screenshot=${winOutPath}`,
    url,
  ], { timeout: budgetMs + 60000 }).catch(() => { /* Chrome exits non-zero even on success */ });
}

/* Windows Chrome refuses a window narrower than roughly 500px and silently
 * renders a wider layout instead. An iframe of the exact width does give a real
 * layout viewport, and media queries inside it respond to that width. */
export const NARROW_LIMIT = 520;

export function iframeHarness(width, height, src, { reportBridge = false } = {}) {
  return `<!doctype html>
<meta charset="utf-8">
<style>html,body{margin:0;background:#111;height:100%}
iframe{width:${width}px;height:${height}px;border:0;display:block}</style>
<iframe src="${src}"></iframe>
${reportBridge ? `<div id="probe-result"></div>
<script>
window.addEventListener('message', function (e) {
  document.getElementById('probe-result').textContent = e.data;
});
</script>` : ''}
`;
}
