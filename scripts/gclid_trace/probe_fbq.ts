/**
 * Targeted probe: is the Meta Pixel installed at all?
 *
 * Loads phonebot.com.au, waits 15s for slow tags, then asks:
 *   - Is window.fbq defined?       → pixel script loaded
 *   - Are there fbq.queue events?  → pixel was called with events
 *   - Did any facebook host receive a request?
 *   - Same checks for Microsoft (uetq) and Bing UET tag
 *
 * Usage: npx tsx scripts/gclid_trace/probe_fbq.ts [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://www.phonebot.com.au/?gclid=TEST_GCLID_PROBE&fbclid=TEST_FBCLID_PROBE&msclkid=TEST_MSCLKID_PROBE';
const WAIT_MS = 15000;

async function main() {
  console.log(`Probing: ${url}`);
  console.log(`Wait time: ${WAIT_MS / 1000}s`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' });
  const page = await context.newPage();

  const allHosts = new Set<string>();
  page.on('request', req => {
    try {
      allHosts.add(new URL(req.url()).host);
    } catch {}
  });

  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  // Trigger user-engagement events that often gate "delayed" pixels
  await page.mouse.move(100, 100);
  await page.mouse.move(500, 400);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(WAIT_MS);

  const probe = await page.evaluate(() => ({
    fbq_defined: typeof (window as any).fbq !== 'undefined',
    fbq_version: (window as any).fbq?.version || null,
    fbq_queue_length: Array.isArray((window as any).fbq?.queue) ? (window as any).fbq.queue.length : null,
    fbq_callMethod_set: !!(window as any).fbq?.callMethod,
    fbq_loaded_flag: (window as any).fbq?.loaded || false,
    _fbp_cookie: document.cookie.split(';').find(c => c.trim().startsWith('_fbp=')) || null,
    _fbc_cookie: document.cookie.split(';').find(c => c.trim().startsWith('_fbc=')) || null,
    uetq_defined: typeof (window as any).uetq !== 'undefined',
    uetq_length: Array.isArray((window as any).uetq) ? (window as any).uetq.length : null,
    UET_defined: typeof (window as any).UET !== 'undefined',
    clarity_defined: typeof (window as any).clarity !== 'undefined',
    gtag_defined: typeof (window as any).gtag !== 'undefined',
    dataLayer_length: Array.isArray((window as any).dataLayer) ? (window as any).dataLayer.length : null,
    dataLayer_event_names: Array.isArray((window as any).dataLayer)
      ? (window as any).dataLayer.map((e: any) => e?.event || (typeof e === 'object' ? Object.keys(e || {})[0] : String(e))).slice(0, 30)
      : null,
  }));

  await browser.close();

  console.log('\n=== Window globals after 15s ===');
  console.log(`  Meta pixel  (window.fbq):       ${probe.fbq_defined ? `✅ defined, v${probe.fbq_version}, loaded=${probe.fbq_loaded_flag}, queued=${probe.fbq_queue_length}` : '❌ NOT INSTALLED on this page'}`);
  console.log(`  Microsoft UET (window.uetq):    ${probe.uetq_defined ? `✅ defined, queue=${probe.uetq_length}` : '❌ NOT INSTALLED on this page'}`);
  console.log(`  Microsoft Clarity:              ${probe.clarity_defined ? '✅ defined' : '❌ not present'}`);
  console.log(`  Google gtag:                    ${probe.gtag_defined ? '✅ defined' : '❌ not present'}`);
  console.log(`  GTM dataLayer length:           ${probe.dataLayer_length}`);
  console.log('');
  console.log('=== Meta pixel cookies ===');
  console.log(`  _fbp (browser ID):  ${probe._fbp_cookie || '❌ not set'}`);
  console.log(`  _fbc (last fbclid): ${probe._fbc_cookie || '❌ not set'}`);
  console.log('');
  console.log('=== dataLayer events fired ===');
  if (probe.dataLayer_event_names) probe.dataLayer_event_names.forEach((n, i) => console.log(`  [${i}] ${n}`));
  console.log('');
  console.log('=== All network hosts contacted (15s window) ===');
  const fbHosts = [...allHosts].filter(h => /facebook|meta|fbq|fbevents/i.test(h));
  const msHosts = [...allHosts].filter(h => /clarity|bing|microsoft/i.test(h));
  console.log(`  Facebook/Meta hosts: ${fbHosts.length === 0 ? '❌ NONE' : fbHosts.join(', ')}`);
  console.log(`  Microsoft hosts:     ${msHosts.length === 0 ? '❌ NONE' : msHosts.join(', ')}`);
  console.log(`  All hosts (${allHosts.size}): ${[...allHosts].sort().join(', ')}`);
}

main().catch(e => { console.error(e); process.exit(1); });
