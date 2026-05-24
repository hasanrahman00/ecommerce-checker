const { extract } = require('./extractor');
const { getProxy } = require('./proxy');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const BLOCK = new Set(['image', 'media', 'font', 'stylesheet']);
const BLOCK_RESOURCES = process.env.BLOCK_RESOURCES !== '0';

async function scrapeOnce(browser, url, gotoTimeout, useProxy = false) {
  let ctx;
  try {
    const proxy = useProxy ? getProxy() : null;
    const contextOpts = {
      ignoreHTTPSErrors: true,
      bypassCSP: true,
      userAgent: UA,
      viewport: { width: 1366, height: 900 },
    };
    if (proxy) contextOpts.proxy = proxy;
    ctx = await browser.newContext(contextOpts);
    const page = await ctx.newPage();
    if (BLOCK_RESOURCES) {
      await page.route('**/*', (route) => {
        if (BLOCK.has(route.request().resourceType())) return route.abort();
        return route.continue();
      });
    }
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: gotoTimeout });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    const data = await page.evaluate(extract);
    return { ok: true, finalUrl: page.url(), ...data };
  } catch (e) {
    return { ok: false, error: e.message.split('\n')[0].slice(0, 200) };
  } finally {
    if (ctx) await ctx.close().catch(() => {});
  }
}

module.exports = { scrapeOnce };
