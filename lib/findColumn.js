function findWebsiteColumn(rows) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  const target = keys.find(k => k.trim().toLowerCase() === 'website');
  if (target) return target;
  return keys.find(k => /web\s*site|url|domain|site/i.test(k)) || null;
}

function normalizeUrl(value) {
  if (!value) return null;
  let url = String(value).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

module.exports = { findWebsiteColumn, normalizeUrl };
