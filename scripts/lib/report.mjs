/* Turning a probe report into a verdict, and printing it.
 *
 * Both verifiers use this, so "what counts as a problem" has one definition. The
 * probe (scripts/probe.js) only measures; the judgement lives here.
 */
import { EXPECTED_SYMBOLS, MIN_FONT_PX, MIN_TARGET_PX } from './config.mjs';

export function problemsFor(r) {
  const bad = [];
  if (r.error) return [r.error];
  if (r.overflow > 0) bad.push(`horizontal overflow of ${r.overflow}px`);
  if (r.offenders?.length) bad.push(`${r.offenders.length} element(s) past the viewport`);
  if (!r.langSwaps) bad.push('the language toggle swapped nothing');
  if (!r.codeSwaps) bad.push('the code toggle swapped nothing');
  if (r.minFont < MIN_FONT_PX) bad.push(`${r.minFont}px text on ${r.minFontEl}`);
  if (r.shortTargets?.length) {
    bad.push(`target(s) under ${MIN_TARGET_PX}px: ${r.shortTargets.join(', ')}`);
  }
  if (r.symbols !== EXPECTED_SYMBOLS) {
    bad.push(`expected ${EXPECTED_SYMBOLS} brand symbols, found ${r.symbols}`);
  }
  if (r.brokenUses?.length) bad.push(`unresolved <use>: ${r.brokenUses.join(', ')}`);
  if (r.pairGaps?.length) bad.push(`toggle gap: ${r.pairGaps.join('; ')}`);
  if (r.missingIds?.length) bad.push(`missing section id: ${r.missingIds.join(', ')}`);
  if (r.deadLinks?.length) bad.push(`link to nothing: ${r.deadLinks.join(', ')}`);
  return bad;
}

const pad = (v, n) => String(v).padStart(n);

export function printTable(rows, { consoleErrors = [] } = {}) {
  const problems = [];

  console.log('\n  asked  inner overflw offend  lang  code minFont targets  syms  broken');
  console.log('  ' + '-'.repeat(70));

  for (const r of rows) {
    const bad = problemsFor(r);

    if (r.error) {
      console.log(`  ${pad(r.width, 5)}  ${r.error}`);
    } else {
      console.log(
        `  ${pad(r.width, 5)} ${pad(r.inner, 6)} ${pad(r.overflow, 7)} ` +
        `${pad(r.offenders.length, 6)} ${pad(r.langSwaps ? 'ok' : 'FAIL', 5)} ` +
        `${pad(r.codeSwaps ? 'ok' : 'FAIL', 5)} ${pad(r.minFont, 7)} ` +
        `${pad(r.shortTargets.length, 7)} ${pad(r.symbols, 5)} ` +
        `${pad(r.brokenUses.length, 7)}` + (bad.length ? '   <-- PROBLEM' : ''),
      );
    }

    for (const b of bad) {
      console.log(`         ${b}`);
      problems.push(`${r.width}px: ${b}`);
    }
    for (const o of r.offenders ?? []) console.log(`         past viewport: ${o}`);
  }

  if (consoleErrors.length) {
    console.log('\n  console errors:');
    for (const e of consoleErrors) console.log(`    ${e}`);
    problems.push(...consoleErrors);
  } else {
    console.log('\n  console errors: none');
  }

  console.log('\n  ' + (problems.length
    ? `${problems.length} PROBLEM(S) FOUND`
    : 'all viewports clean'));

  return problems;
}
