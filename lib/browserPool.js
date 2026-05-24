const { chromium } = require('playwright');

const POOL_SIZE = parseInt(process.env.BROWSER_POOL || '3', 10);
const pool = [];
const launching = [];

async function launchOne() {
  const opts = [
    { headless: true },
    { headless: false },
    { channel: 'chrome', headless: true },
  ];
  let lastErr;
  for (const o of opts) {
    try { return await chromium.launch(o); }
    catch (e) { lastErr = e; console.error('[pool] launch failed:', JSON.stringify(o), '-', e.message.split('\n')[0]); }
  }
  throw lastErr;
}

async function getBrowser(slot = 0) {
  const idx = ((slot % POOL_SIZE) + POOL_SIZE) % POOL_SIZE;
  if (pool[idx] && pool[idx].isConnected()) return pool[idx];
  if (!launching[idx]) {
    launching[idx] = launchOne()
      .then(b => { pool[idx] = b; launching[idx] = null; return b; })
      .catch(e => { launching[idx] = null; throw e; });
  }
  return launching[idx];
}

async function warmUp() {
  await Promise.all(Array.from({ length: POOL_SIZE }, (_, i) => getBrowser(i)));
  console.log(`[pool] ${POOL_SIZE} browsers ready`);
}

async function closeAll() {
  await Promise.all(pool.map(b => b && b.close().catch(() => {})));
  pool.length = 0;
}

module.exports = { getBrowser, warmUp, closeAll, POOL_SIZE };
