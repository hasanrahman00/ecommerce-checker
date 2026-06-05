const { getBrowser } = require('./browserPool');
const { scrapeOnce } = require('./scrapeOnce');
const { getProxy } = require('./proxy');
const { createLimiter } = require('./limiter');

const TRANSIENT = /Timeout|net::|ERR_|disconnected|Navigation failed|Execution context|eval is disabled/i;
const ATTEMPTS = Math.max(1, parseInt(process.env.SCRAPE_ATTEMPTS || '3', 10));
const TIMEOUTS = [30000, 45000, 60000];
const PROXY_RETRY_ONLY = process.env.PROXY_ON_RETRY_ONLY !== '0';
// Limit concurrent PROXY connections so residential proxies aren't overloaded.
// Independent of scrape concurrency — direct attempts are unlimited.
const proxyLimit = createLimiter(Math.max(1, parseInt(process.env.PROXY_CONCURRENCY || '8', 10)));

function attempt(browser, url, timeout, useProxy) {
  return useProxy
    ? proxyLimit(() => scrapeOnce(browser, url, timeout, true))
    : scrapeOnce(browser, url, timeout, false);
}

async function scrapeUrl(url, slot = 0) {
  const hasProxy = !!getProxy();
  let result;
  for (let i = 0; i < ATTEMPTS; i++) {
    const browser = await getBrowser(slot);
    const useProxy = hasProxy && (PROXY_RETRY_ONLY ? i > 0 : true);
    const timeout = TIMEOUTS[Math.min(i, TIMEOUTS.length - 1)];
    result = await attempt(browser, url, timeout, useProxy);
    if (result.ok) return result;
    if (!TRANSIENT.test(result.error || '')) return result;
    if (i < ATTEMPTS - 1) await new Promise(r => setTimeout(r, 1200 * (i + 1)));
  }
  return result;
}

module.exports = { scrapeUrl, getBrowser };
