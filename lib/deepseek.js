const axios = require('axios');
const { SYSTEM } = require('./prompt');
const { createLimiter } = require('./limiter');
const { isRateLimit, isFatal, describe } = require('./aiErrors');

const ENDPOINT = process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const limit = createLimiter(parseInt(process.env.AI_CONCURRENCY || '10', 10));
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '4', 10);
let breaker = null; // set to a clear message once a fatal billing/auth error is seen

function resetBreaker() { breaker = null; }
const fail = (error) => ({ isCommerce: 'Error', niche: 'Error', category: 'Error', error });

function buildUser(d) {
  return `URL: ${d.url}\nFinal: ${d.finalUrl || d.url}\nTitle: ${d.title}\nDesc: ${d.description}\nOG: ${d.ogType}\nPlatform: ${d.platform || 'none'}\nCTAs: ${d.buttons || 'none'}\nSchema types: ${d.schemaTypes || 'none'}\nCart links: ${d.cartLinks || 'none'}\nPrices: ${d.prices || 'none'}\nJSON-LD: ${(d.schema || '').slice(0, 700)}\nBody: ${(d.text || '').slice(0, 1800)}`;
}

async function callOnce(d, apiKey) {
  const { data } = await axios.post(ENDPOINT, {
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: buildUser(d) }],
    temperature: 0,
    response_format: { type: 'json_object' },
    thinking: { type: 'disabled' }, // cheapest: non-thinking mode
  }, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30000 });
  const out = JSON.parse(data.choices[0].message.content);
  return { isCommerce: out.is_commerce || 'Unknown', niche: out.niche || 'Unknown', category: out.category || 'Other' };
}

async function classifyWebsite(d) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fail('Missing API key');
  if (breaker) return fail(breaker);
  return limit(async () => {
    if (breaker) return fail(breaker);
    for (let attempt = 0; ; attempt++) {
      try { return await callOnce(d, apiKey); }
      catch (e) {
        if (isRateLimit(e) && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 15000) + Math.random() * 500));
          continue;
        }
        const msg = describe(e);
        if (isFatal(e) && !breaker) { breaker = msg; console.error('[deepseek] FATAL —', msg, '(further calls short-circuited until next run)'); }
        return fail(msg);
      }
    }
  });
}

module.exports = { classifyWebsite, resetBreaker };
