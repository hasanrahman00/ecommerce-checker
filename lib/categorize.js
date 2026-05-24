const { CATEGORIES } = require('./taxonomy');
const { RULES } = require('./categoryRules');

function validateAi(ai) {
  if (!ai) return null;
  const norm = String(ai).trim().toLowerCase();
  return CATEGORIES.find(c => c.toLowerCase() === norm) || null;
}

function ruleMatch(text) {
  const haystack = String(text || '').trim().toLowerCase();
  if (!haystack) return null;
  for (const [cat, rx] of RULES) if (rx.test(haystack)) return cat;
  return null;
}

function categorize(aiCategory, niche, extra = '') {
  const aiValid = validateAi(aiCategory);
  if (aiValid && aiValid !== 'Other') return aiValid;
  const fallback = ruleMatch(`${niche || ''} ${extra}`);
  if (fallback) return fallback;
  return aiValid || 'Other';
}

module.exports = { categorize };
