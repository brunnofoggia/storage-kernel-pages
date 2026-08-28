/* Verify dist/ across viewport widths. This is the harness CI runs.
 *
 * The checks come from scripts/probe.js and the verdict from lib/report.mjs, both
 * shared with verify-local.mjs — the only difference between the two harnesses is
 * how they open a browser.
 *
 *   node scripts/verify.mjs
 *
 * Needs Playwright with a Chromium install:
 *   npm ci && npx playwright install --with-deps chromium
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, PROBE, STORE_KEYS, WIDTHS } from './lib/config.mjs';
import { printTable } from './lib/report.mjs';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'error: playwright is not installed.\n' +
    '  npm ci && npx playwright install --with-deps chromium\n' +
    '\n' +
    "  On a box where Playwright's browser cannot start (missing libnspr4 /\n" +
    '  libnss3), use the Windows-Chrome harness, which runs the same checks:\n' +
    '    npm run verify:local',
  );
  process.exit(1);
}

const PAGE = join(DIST, 'index.html');

if (!existsSync(PAGE)) {
  console.error('error: dist/index.html not found — run `npm run build` first');
  process.exit(1);
}

const browser = await chromium.launch();
const consoleErrors = [];
const rows = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 960 } });
  const page = await context.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`${width}px: ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`${width}px: ${e.message}`));

  await page.goto(`file://${PAGE}`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  await page.addScriptTag({ path: PROBE });

  rows.push({ width, ...(await page.evaluate('window.__probe()')) });
  await context.close();
}

/* The published package metadata links here with ?code=, so the query has to beat
 * a stored preference. Seeded with the opposite value to prove it does. */
const queryChecks = [];
for (const [param, value, other, reads] of [
  ['code', 'ts', 'py', 'activeCode'],
  ['code', 'py', 'ts', 'activeCode'],
  ['lang', 'pt', 'en', 'activeLang'],
]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`file://${PAGE}`, { waitUntil: 'load' });
  await page.evaluate(([k, v]) => localStorage.setItem(k, v),
    [STORE_KEYS[param], other]);
  await page.goto(`file://${PAGE}?${param}=${value}`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.addScriptTag({ path: PROBE });
  const r = await page.evaluate('window.__probe()');
  queryChecks.push({ param, value, other, got: r[reads] });
  await context.close();
}

await browser.close();

console.log('\n  query overrides a stored preference');
console.log('  ' + '-'.repeat(46));
const queryProblems = [];
for (const c of queryChecks) {
  const ok = c.got === c.value;
  console.log(`  ?${c.param}=${c.value} over stored "${c.other}" -> ${c.got}  ${ok ? 'ok' : 'FAIL'}`);
  if (!ok) queryProblems.push(`?${c.param}=${c.value} gave "${c.got}"`);
}

const problems = printTable(rows, { consoleErrors });
problems.push(...queryProblems);
process.exit(problems.length ? 1 : 0);
