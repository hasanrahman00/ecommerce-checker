function statusOf(e) { return e.response && e.response.status; }

function isRateLimit(e) {
  const s = statusOf(e);
  return s === 429 || s === 503 || /rate.?limit|too many/i.test(e.message || '');
}

function isFatal(e) {
  const s = statusOf(e);
  return s === 401 || s === 402 || s === 403;
}

function describe(e) {
  const s = statusOf(e);
  if (s === 402) return 'DeepSeek balance exhausted — top up at platform.deepseek.com';
  if (s === 401) return 'DeepSeek API key invalid — check DEEPSEEK_API_KEY in .env';
  if (s === 403) return 'DeepSeek access forbidden — check your API key/plan';
  return e.message;
}

module.exports = { isRateLimit, isFatal, describe };
