/* The deploy target, read from site.config.json.
 *
 * One file holds the origin because five outputs depend on it — dist/CNAME, the
 * canonical link, og:url, robots.txt and sitemap.xml — and a site served from
 * the wrong host in any one of them is worse than a site with none of them.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './config.mjs';

const CONFIG = join(ROOT, 'site.config.json');

export async function readSite() {
  let raw;
  try {
    raw = await readFile(CONFIG, 'utf8');
  } catch {
    throw new Error(`site.config.json is missing at ${CONFIG}`);
  }

  const { url } = JSON.parse(raw);

  if (!url) return { configured: false, origin: null, host: null };

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`site.config.json: "${url}" is not a URL`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`site.config.json: expected an https origin, got "${url}"`);
  }
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`site.config.json: expected a bare origin, got "${url}"`);
  }

  return {
    configured: true,
    origin: parsed.origin,
    host: parsed.host,
  };
}
