/**
 * gclid redirect trace — diagnoses where the gclid query parameter is being stripped.
 *
 * Usage:
 *   tsx scripts/gclid_trace/trace.ts                    # default: trace phonebot.com.au homepage
 *   tsx scripts/gclid_trace/trace.ts <url>              # trace a specific URL
 *   tsx scripts/gclid_trace/trace.ts <url> --gclid=XYZ  # use a custom gclid
 *
 * What it does:
 * 1. Hits the URL with ?gclid=test_phonebot_<timestamp> attached
 * 2. Follows EVERY redirect manually (max 10 hops)
 * 3. For each hop logs: HTTP status, location header, whether gclid is still in the URL,
 *    set-cookie headers, cache headers
 * 4. Reports the FIRST hop where gclid disappears — that's the smoking gun
 *
 * Run output through to your dev team to identify which redirect/middleware/plugin
 * is dropping the param. Common culprits in OpenCart 2.2:
 *   - SEO URL extension's canonical redirect
 *   - Currency / language switcher (?currency=AUD added, gclid dropped)
 *   - Session middleware re-issuing cookie + force-redirecting
 *   - .htaccess RewriteRule with [L,R=301] but no [QSA] flag (drops query string!)
 *   - Cloudflare / CDN edge rules
 */

const DEFAULT_URL = 'https://www.phonebot.com.au/';
const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--')) || DEFAULT_URL;
const gclidArg = args.find(a => a.startsWith('--gclid='));
const gclid = gclidArg ? gclidArg.split('=')[1] : `test_phonebot_${Date.now()}`;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

interface Hop {
  hop: number;
  url: string;
  status: number;
  location: string | null;
  hasGclid: boolean;
  hasFbclid: boolean;
  hasMsclkid: boolean;
  setCookie: string[];
  cacheControl: string | null;
  cacheStatus: string | null;
  server: string | null;
  poweredBy: string | null;
  durationMs: number;
}

function urlHasParam(u: string, key: string): boolean {
  try {
    return new URL(u).searchParams.has(key);
  } catch {
    return false;
  }
}

async function trace(start: string): Promise<Hop[]> {
  const hops: Hop[] = [];
  let current = start;
  for (let i = 0; i < 10; i++) {
    const t0 = Date.now();
    const res = await fetch(current, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,*/*' },
      redirect: 'manual',
    });
    const headers = res.headers;
    const setCookie: string[] = [];
    headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') setCookie.push(value);
    });

    const location = headers.get('location');

    hops.push({
      hop: i,
      url: current,
      status: res.status,
      location,
      hasGclid: urlHasParam(current, 'gclid'),
      hasFbclid: urlHasParam(current, 'fbclid'),
      hasMsclkid: urlHasParam(current, 'msclkid'),
      setCookie,
      cacheControl: headers.get('cache-control'),
      cacheStatus: headers.get('cf-cache-status') || headers.get('x-cache'),
      server: headers.get('server'),
      poweredBy: headers.get('x-powered-by'),
      durationMs: Date.now() - t0,
    });

    if (![301, 302, 303, 307, 308].includes(res.status) || !location) break;
    // Resolve relative URLs
    current = new URL(location, current).toString();
  }
  return hops;
}

function buildTestUrl(base: string, gclidValue: string): string {
  const u = new URL(base);
  u.searchParams.set('gclid', gclidValue);
  return u.toString();
}

function fmtUrl(u: string): string {
  if (u.length <= 80) return u;
  return u.slice(0, 77) + '…';
}

function report(hops: Hop[]) {
  console.log(`\n=== gclid redirect trace ===\n`);
  hops.forEach(h => {
    const gclidIcon = h.hasGclid ? '✅' : '❌';
    console.log(`[hop ${h.hop}] ${h.status}  ${gclidIcon} gclid  ${h.durationMs}ms`);
    console.log(`           URL: ${fmtUrl(h.url)}`);
    if (h.location) console.log(`           → Location: ${fmtUrl(h.location)}`);
    if (h.server) console.log(`           Server: ${h.server}${h.poweredBy ? ' / ' + h.poweredBy : ''}`);
    if (h.cacheStatus) console.log(`           Cache: ${h.cacheStatus}${h.cacheControl ? ' (' + h.cacheControl + ')' : ''}`);
    if (h.setCookie.length) {
      console.log(`           Set-Cookie (${h.setCookie.length}):`);
      h.setCookie.forEach(c => console.log(`             ${c.split(';')[0]}`));
    }
    console.log('');
  });

  // Diagnosis
  const firstLoss = hops.findIndex((h, i) => i > 0 && !h.hasGclid && hops[i - 1].hasGclid);
  if (firstLoss === -1 && hops.every(h => h.hasGclid)) {
    console.log(`✅ gclid preserved through all ${hops.length} hop(s). No stripping detected.`);
  } else if (firstLoss === -1 && !hops[0].hasGclid) {
    console.log(`❌ gclid was missing on the first request — check that the test URL was built correctly.`);
  } else {
    const before = hops[firstLoss - 1];
    const after = hops[firstLoss];
    console.log(`❌ SMOKING GUN — gclid dropped between hop ${firstLoss - 1} and hop ${firstLoss}:`);
    console.log(`     Before (${before.status}): ${fmtUrl(before.url)}`);
    console.log(`     After  (${after.status}): ${fmtUrl(after.url)}`);
    console.log('');
    console.log(`   Likely cause: the redirect at hop ${firstLoss - 1} dropped the query string.`);
    console.log(`   For OpenCart 2.2, common offenders:`);
    console.log(`     - .htaccess RewriteRule missing [QSA] flag`);
    console.log(`     - SEO URL extension's canonicalisation`);
    console.log(`     - Currency / language redirect adding ?currency=AUD without preserving gclid`);
    console.log(`     - Cloudflare page rule rewriting URL`);
    console.log('');
    console.log(`   Hand this output to your dev team. Ask them to inspect the redirect at:`);
    console.log(`     ${fmtUrl(before.url)}  →  ${fmtUrl(before.location || '?')}`);
  }
}

async function main() {
  const target = buildTestUrl(url, gclid);
  console.log(`Tracing: ${target}`);
  console.log(`Using gclid: ${gclid}\n`);
  const hops = await trace(target);
  report(hops);

  // Also write a JSON dump for the dev team
  const out = JSON.stringify({ target, gclid, hops, traced_at: new Date().toISOString() }, null, 2);
  const fs = await import('node:fs');
  const path = await import('node:path');
  const outDir = path.resolve(import.meta.dirname || '.', 'outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `trace_${Date.now()}.json`);
  fs.writeFileSync(outPath, out);
  console.log(`\nFull JSON dump: ${outPath}`);
}

main().catch(err => {
  console.error('Trace failed:', err);
  process.exit(1);
});
