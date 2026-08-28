/* Verify dist/ across viewport widths using the Windows Chrome WSL can reach.
 *
 * The checks come from scripts/probe.js and the verdict from lib/report.mjs, both
 * shared with verify.mjs — the only difference between the two harnesses is how
 * they open a browser.
 *
 * This exists because Playwright's chrome-headless-shell will not start on this
 * box (libnspr4.so and libnss3 are missing, and installing them means touching
 * system packages). Install those and this file can go.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, PROBE, STAGE_PREFIX, STORE_KEYS, WIDTHS } from './lib/config.mjs';
import { printTable } from './lib/report.mjs';
import { dumpDom, iframeHarness, stage } from './lib/win-chrome.mjs';

const RUNNER = `
<script src="probe.js"></script>
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var out;
    try { out = window.__probe(); } catch (e) { out = { error: String(e) }; }
    var text = JSON.stringify(out);
    try { window.parent.postMessage(text, '*'); } catch (e) {}
    var d = document.createElement('div');
    d.id = 'probe-result';
    d.textContent = text;
    document.body.appendChild(d);
  }, 900);
});
</script>
`;

function extract(dom) {
  const m = dom.match(/<div id="probe-result">([\s\S]*?)<\/div>/);
  if (!m || !m[1].trim()) return { error: 'the probe did not report' };
  const decoded = m[1]
    .replaceAll('&quot;', '"').replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>').replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
  try {
    return JSON.parse(decoded);
  } catch (e) {
    return { error: `unreadable probe output: ${e.message}` };
  }
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('error: dist/index.html not found — run `npm run build` first');
  process.exit(1);
}

let area;
try {
  area = await stage(`${STAGE_PREFIX}verify`, DIST);
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}

const page = await readFile(join(DIST, 'index.html'), 'utf8');
await area.write('probe.html', page.replace('</body>', RUNNER + '</body>'));
await area.write('probe.js', await readFile(PROBE, 'utf8'));

/* Every width goes through an iframe, not just the narrow ones. Chrome will not
 * open a window under ~520px and silently renders wider, and even above that the
 * window is ~16px wider than the layout viewport it produces — so asking for
 * 1440 directly actually measures 1424. An iframe of the exact size makes the
 * number in the table the number that was tested. */
const rows = [];
for (const width of WIDTHS) {
  await area.write('harness.html', iframeHarness(width, 960, 'probe.html', { reportBridge: true }));
  const dom = await dumpDom(area.url('harness.html'), { width: width + 60 });
  rows.push({ width, ...extract(dom) });
}

/* Same check as verify.mjs: the query must beat what localStorage holds. The
 * seeding runs inside the page, since this harness cannot drive the browser. */
const SEED = `
<script>
try {
  var q = new URLSearchParams(location.search);
  if (q.get('seed')) localStorage.setItem(q.get('seedKey'), q.get('seed'));
} catch (e) {}
</script>
`;
await area.write('qprobe.html', page.replace('<head>', '<head>' + SEED).replace('</body>', RUNNER + '</body>'));

const queryChecks = [];
for (const [param, value, other, key, reads] of [
  ['code', 'ts', 'py', STORE_KEYS.code, 'activeCode'],
  ['code', 'py', 'ts', STORE_KEYS.code, 'activeCode'],
  ['lang', 'pt', 'en', STORE_KEYS.lang, 'activeLang'],
]) {
  const query = `?${param}=${value}&seed=${other}&seedKey=${key}`;
  const dom = await dumpDom(area.url('qprobe.html') + query, { width: 1280 });
  queryChecks.push({ param, value, other, got: extract(dom)[reads] });
}

console.log('\n  query overrides a stored preference');
console.log('  ' + '-'.repeat(46));
const queryProblems = [];
for (const c of queryChecks) {
  const ok = c.got === c.value;
  console.log(`  ?${c.param}=${c.value} over stored "${c.other}" -> ${c.got}  ${ok ? 'ok' : 'FAIL'}`);
  if (!ok) queryProblems.push(`?${c.param}=${c.value} gave "${c.got}"`);
}

const problems = printTable(rows).concat(queryProblems);
process.exit(problems.length ? 1 : 0);
