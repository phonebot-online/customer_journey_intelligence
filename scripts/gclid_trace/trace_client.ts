/**
 * Client-side gclid trace — what happens to click IDs *after* the URL hits the browser.
 *
 * The server-side trace (trace.ts) confirmed gclid arrives at the browser intact.
 * But BigQuery shows only 26% of paid sessions retain gclid. This script answers:
 * what happens to those click IDs in the ~few hundred ms between page paint and tag fire?
 *
 * What it instruments:
 *  - history.pushState / history.replaceState calls (the #1 suspect for URL "cleaning")
 *  - All outgoing network requests, flagging which contain the test click IDs
 *  - dataLayer pushes (so we can see what GTM ingests)
 *  - First-party cookies (gclid persistence cookies should land here)
 *  - Console errors / warnings
 *  - URL at: page-load-start, gtm.js, gtm.dom, gtm.load, +5s settled
 *
 * Usage:
 *   npx tsx scripts/gclid_trace/trace_client.ts
 *   npx tsx scripts/gclid_trace/trace_client.ts <url>
 *   npx tsx scripts/gclid_trace/trace_client.ts <url> --headed
 */
import { chromium, type Request, type Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--')) || 'https://www.phonebot.com.au/';
const headed = args.includes('--headed');

const TEST_IDS = {
  gclid: `TEST_GCLID_${Date.now()}`,
  fbclid: `TEST_FBCLID_${Date.now()}`,
  msclkid: `TEST_MSCLKID_${Date.now()}`,
};
const TEST_VALUES = Object.values(TEST_IDS);

function buildTestUrl(base: string): string {
  const u = new URL(base);
  u.searchParams.set('gclid', TEST_IDS.gclid);
  u.searchParams.set('fbclid', TEST_IDS.fbclid);
  u.searchParams.set('msclkid', TEST_IDS.msclkid);
  u.searchParams.set('utm_source', 'google');
  u.searchParams.set('utm_medium', 'cpc');
  u.searchParams.set('utm_campaign', 'gclid_trace_test');
  return u.toString();
}

function hasAnyTestId(s: string): { gclid: boolean; fbclid: boolean; msclkid: boolean } {
  return {
    gclid: s.includes(TEST_IDS.gclid),
    fbclid: s.includes(TEST_IDS.fbclid),
    msclkid: s.includes(TEST_IDS.msclkid),
  };
}

interface TraceReport {
  target: string;
  testIds: typeof TEST_IDS;
  initialUrl: string;
  finalUrl: string;
  urlChanges: { event: string; url: string; tMs: number }[];
  historyApiCalls: { method: string; arg: any; tMs: number; url: string }[];
  dataLayerEvents: any[];
  cookies: { name: string; value: string; matchesTestId: boolean }[];
  outboundRequests: {
    url: string;
    host: string;
    purpose: string;
    method: string;
    hasGclid: boolean;
    hasFbclid: boolean;
    hasMsclkid: boolean;
    tMs: number;
  }[];
  consoleMessages: { type: string; text: string }[];
  diagnosis: {
    finalUrlHasGclid: boolean;
    finalUrlHasFbclid: boolean;
    finalUrlHasMsclkid: boolean;
    historyReplacedAfterLoad: boolean;
    gclidReachedAnalytics: boolean;
    fbclidReachedAnalytics: boolean;
    msclkidReachedAnalytics: boolean;
    persistenceCookieFound: boolean;
    smokingGun: string;
  };
}

function classifyHost(host: string): string {
  if (host.includes('googletagmanager.com')) return 'GTM (load)';
  if (host.includes('google-analytics.com')) return 'GA4 (analytics beacon)';
  if (host.includes('analytics.google.com')) return 'GA4 (analytics beacon)';
  if (host.includes('doubleclick.net')) return 'Google Ads (gclid pixel)';
  if (host.includes('googleadservices.com')) return 'Google Ads (conversions)';
  if (host.includes('facebook.com') || host.includes('facebook.net')) return 'Meta (fbclid pixel)';
  if (host.includes('bing.com') || host.includes('clarity.ms')) return 'Microsoft (msclkid pixel)';
  if (host.includes('profitmetrics')) return 'ProfitMetrics';
  if (host.includes('phonebot.com.au')) return 'phonebot.com.au (own)';
  return 'other';
}

async function main() {
  console.log(`\n=== Client-side click-ID trace ===\n`);
  console.log(`Target: ${url}`);
  console.log(`Test IDs: gclid=${TEST_IDS.gclid}\n           fbclid=${TEST_IDS.fbclid}\n           msclkid=${TEST_IDS.msclkid}\n`);

  const target = buildTestUrl(url);

  const browser = await chromium.launch({ headless: !headed });
  // Clean cookie jar
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const t0 = Date.now();
  const tMs = () => Date.now() - t0;

  const urlChanges: TraceReport['urlChanges'] = [];
  const historyApiCalls: TraceReport['historyApiCalls'] = [];
  const dataLayerEvents: any[] = [];
  const outboundRequests: TraceReport['outboundRequests'] = [];
  const consoleMessages: TraceReport['consoleMessages'] = [];

  // Hook history.pushState/replaceState BEFORE page scripts run.
  // We override the prototypes on every navigation so we catch site code.
  await context.addInitScript(() => {
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    (window as any).__historyApiCalls__ = [];
    history.pushState = function (data: any, ...rest: any[]) {
      (window as any).__historyApiCalls__.push({
        method: 'pushState',
        arg: rest[1],
        tMs: performance.now(),
        url: location.href,
      });
      // @ts-ignore
      return origPush.apply(this, [data, ...rest]);
    };
    history.replaceState = function (data: any, ...rest: any[]) {
      (window as any).__historyApiCalls__.push({
        method: 'replaceState',
        arg: rest[1],
        tMs: performance.now(),
        url: location.href,
      });
      // @ts-ignore
      return origReplace.apply(this, [data, ...rest]);
    };
    // Make dataLayer pushes observable
    (window as any).__dataLayerSnapshots__ = [];
    const grabDataLayer = () => {
      try {
        const dl = (window as any).dataLayer;
        if (Array.isArray(dl)) {
          (window as any).__dataLayerSnapshots__ = JSON.parse(JSON.stringify(dl));
        }
      } catch {}
    };
    setTimeout(grabDataLayer, 100);
    setTimeout(grabDataLayer, 1000);
    setTimeout(grabDataLayer, 3000);
    setTimeout(grabDataLayer, 5000);
  });

  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      urlChanges.push({ event: 'framenavigated', url: frame.url(), tMs: tMs() });
    }
  });

  page.on('request', (req: Request) => {
    const reqUrl = req.url();
    let host = '';
    try { host = new URL(reqUrl).host; } catch {}
    const checks = hasAnyTestId(reqUrl);
    const purpose = classifyHost(host);
    // Only record interesting requests: any with a test ID, or any analytics/ad endpoint
    const isInteresting = checks.gclid || checks.fbclid || checks.msclkid
      || /googletagmanager|google-analytics|analytics\.google|doubleclick|googleadservices|facebook|clarity|bing|profitmetrics/i.test(host);
    if (isInteresting) {
      outboundRequests.push({
        url: reqUrl.length > 300 ? reqUrl.slice(0, 297) + '...' : reqUrl,
        host,
        purpose,
        method: req.method(),
        hasGclid: checks.gclid,
        hasFbclid: checks.fbclid,
        hasMsclkid: checks.msclkid,
        tMs: tMs(),
      });
    }
  });

  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text().slice(0, 200) });
    }
  });

  // Navigate
  const initialUrl = target;
  await page.goto(target, { waitUntil: 'load', timeout: 30000 });
  // Settle: wait 5s for late tags + delayed history.replaceState calls
  await page.waitForTimeout(5000);

  const finalUrl = page.url();
  const historyCalls = await page.evaluate(() => (window as any).__historyApiCalls__ || []);
  const dlSnapshot = await page.evaluate(() => (window as any).__dataLayerSnapshots__ || []);
  const cookies = await context.cookies();
  await browser.close();

  const cookieDump = cookies.map(c => ({
    name: c.name,
    value: c.value.length > 80 ? c.value.slice(0, 77) + '...' : c.value,
    matchesTestId: TEST_VALUES.some(v => c.value.includes(v)),
  }));

  // dataLayer event flattening — show events that contain click IDs OR are gtm.* lifecycle events
  const dlSerialized = JSON.stringify(dlSnapshot);
  const dlEvents = (Array.isArray(dlSnapshot) ? dlSnapshot : []).filter((evt: any) => {
    const s = JSON.stringify(evt);
    return TEST_VALUES.some(v => s.includes(v))
      || s.includes('gtm.')
      || /event/i.test(JSON.stringify(Object.keys(evt || {})));
  });

  const finalUrlChecks = hasAnyTestId(finalUrl);
  const replaceStateAfterLoad = historyCalls.some((h: any) => h.method === 'replaceState');
  const gclidInAnyAnalyticsReq = outboundRequests.some(r => r.hasGclid && /google-analytics|doubleclick|googleadservices|profitmetrics/i.test(r.host));
  const fbclidInAnyAnalyticsReq = outboundRequests.some(r => r.hasFbclid && /facebook/i.test(r.host));
  const msclkidInAnyAnalyticsReq = outboundRequests.some(r => r.hasMsclkid && /bing|clarity|microsoft/i.test(r.host));
  const persistenceCookie = cookieDump.find(c => /gclid|fbclid|msclkid|_gcl|_gac|_fbp|_fbc/i.test(c.name));

  // Smoking gun reasoning
  let smokingGun = 'unknown — see network and history calls below';
  if (!finalUrlChecks.gclid && replaceStateAfterLoad) {
    const replaces = historyCalls.filter((h: any) => h.method === 'replaceState');
    smokingGun = `history.replaceState() called ${replaces.length} time(s) — URL was rewritten client-side, stripping click IDs from window.location.href before GTM tags read it.`;
  } else if (!finalUrlChecks.gclid) {
    smokingGun = 'final URL no longer has gclid but no history.replaceState detected — likely a meta-refresh or anchor link click sequence.';
  } else if (finalUrlChecks.gclid && !gclidInAnyAnalyticsReq) {
    smokingGun = 'gclid still in URL but never reached an analytics beacon — GTM tag may not be firing at all on this page.';
  } else if (gclidInAnyAnalyticsReq) {
    smokingGun = 'gclid reached at least one analytics endpoint — capture appears to work on this URL. Cross-check BigQuery to see why prod data shows 26%.';
  }

  const report: TraceReport = {
    target,
    testIds: TEST_IDS,
    initialUrl,
    finalUrl,
    urlChanges,
    historyApiCalls: historyCalls,
    dataLayerEvents: dlEvents,
    cookies: cookieDump,
    outboundRequests,
    consoleMessages,
    diagnosis: {
      finalUrlHasGclid: finalUrlChecks.gclid,
      finalUrlHasFbclid: finalUrlChecks.fbclid,
      finalUrlHasMsclkid: finalUrlChecks.msclkid,
      historyReplacedAfterLoad: replaceStateAfterLoad,
      gclidReachedAnalytics: gclidInAnyAnalyticsReq,
      fbclidReachedAnalytics: fbclidInAnyAnalyticsReq,
      msclkidReachedAnalytics: msclkidInAnyAnalyticsReq,
      persistenceCookieFound: !!persistenceCookie,
      smokingGun,
    },
  };

  // Pretty print
  const D = report.diagnosis;
  console.log('--- URL state ---');
  console.log(`  Loaded:  ${initialUrl}`);
  console.log(`  Final:   ${finalUrl}`);
  console.log(`  gclid in final URL?    ${D.finalUrlHasGclid ? '✅' : '❌'}`);
  console.log(`  fbclid in final URL?   ${D.finalUrlHasFbclid ? '✅' : '❌'}`);
  console.log(`  msclkid in final URL?  ${D.finalUrlHasMsclkid ? '✅' : '❌'}`);
  console.log('');

  console.log('--- history API calls (the smoking gun if any) ---');
  if (historyCalls.length === 0) {
    console.log('  (no history.pushState / replaceState calls — URL not rewritten by JS)');
  } else {
    historyCalls.forEach((h: any, i: number) => {
      console.log(`  [${i}] ${h.method} → ${h.arg}  (at ${h.tMs.toFixed(0)}ms)`);
      console.log(`        from URL: ${h.url}`);
    });
  }
  console.log('');

  console.log('--- analytics / ad-platform requests ---');
  if (outboundRequests.length === 0) {
    console.log('  (none — no GTM/GA/ads tags fired)');
  } else {
    outboundRequests.slice(0, 30).forEach(r => {
      const flags = [
        r.hasGclid ? 'gclid✅' : '',
        r.hasFbclid ? 'fbclid✅' : '',
        r.hasMsclkid ? 'msclkid✅' : '',
      ].filter(Boolean).join(' ');
      console.log(`  [${r.tMs}ms] ${r.method} ${r.purpose}  ${flags}`);
      console.log(`            ${r.url.slice(0, 140)}`);
    });
    if (outboundRequests.length > 30) console.log(`  ... and ${outboundRequests.length - 30} more`);
  }
  console.log('');

  console.log('--- click-ID survival into analytics beacons ---');
  console.log(`  gclid →   Google Ads/GA4 beacon?  ${D.gclidReachedAnalytics ? '✅' : '❌'}`);
  console.log(`  fbclid →  Meta beacon?            ${D.fbclidReachedAnalytics ? '✅' : '❌'}`);
  console.log(`  msclkid → Microsoft beacon?       ${D.msclkidReachedAnalytics ? '✅' : '❌'}`);
  console.log('');

  console.log('--- click-ID persistence cookies ---');
  const candidateCookies = cookieDump.filter(c => /gclid|fbclid|msclkid|_gcl|_gac|_fbp|_fbc/i.test(c.name));
  if (candidateCookies.length === 0) {
    console.log('  ❌ no _gcl_aw, _gac, _fbp, _fbc, or custom gclid_persistence cookie set');
    console.log('     This means: even if gclid was captured by GTM, no first-party persistence is set up.');
  } else {
    candidateCookies.forEach(c => {
      console.log(`  ✅ ${c.name} = ${c.value}  ${c.matchesTestId ? '(contains test gclid)' : ''}`);
    });
  }
  console.log('');

  console.log('--- diagnosis ---');
  console.log(`  ${D.smokingGun}`);
  console.log('');

  // Write JSON dump
  const outDir = resolve(__dirname, 'outputs');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `client_trace_${Date.now()}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Full JSON dump: ${outPath}`);
}

main().catch(err => {
  console.error('Trace failed:', err);
  process.exit(1);
});
