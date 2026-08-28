/* Paths, the viewport set and the thresholds, in one place so the build, the two
 * verifiers and the screenshot tool cannot disagree about them. */
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

export const ROOT = resolve(HERE, '..', '..');
export const SRC = join(ROOT, 'src');
export const DIST = join(ROOT, 'dist');
export const SCRIPTS = join(ROOT, 'scripts');
export const PROBE = join(SCRIPTS, 'probe.js');
export const TMP = join(ROOT, 'tmp');

/* 1440 down to 360: desktop, laptop, tablet portrait and landscape, and the
 * three phone widths that actually matter. */
export const WIDTHS = [1440, 1280, 1024, 834, 768, 430, 390, 360];

/* The built page must carry exactly these brand marks. */
export const EXPECTED_SYMBOLS = 7;

/* The floor design-spec.md §6 sets for rendered text. */
export const MIN_FONT_PX = 12;

/* WCAG 2.2 AA, Target Size (Minimum). */
export const MIN_TARGET_PX = 24;

/* Where the page remembers each toggle. src/app.js declares the same two keys;
 * it runs in the browser and cannot import this file, so that pair is the one
 * unavoidable duplication — change both together. */
export const STORE_KEYS = { code: 'stk.code', lang: 'stk.lang' };

/* Prefix for the directories staged under the Windows temp dir. Distinct per
 * repository, so two sibling family pages verified on the same box do not
 * overwrite each other's staging area. */
export const STAGE_PREFIX = 'stk';
