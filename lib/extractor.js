function extract() {
  const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content || '';
  const html = document.documentElement.outerHTML || '';
  const platform = (html.match(/Shopify|WooCommerce|Magento|BigCommerce|PrestaShop|Wix\s?Stores|Squarespace[- ]Commerce|Ecwid|Webflow\s?Ecommerce/i) || [''])[0];
  const ctaTerms = /add to cart|add to bag|buy now|checkout|shop now|order now|add to basket|view cart/i;
  const buttons = [...document.querySelectorAll('button, a, input[type="submit"]')]
    .map(b => (b.textContent || b.value || '').trim())
    .filter(t => t && ctaTerms.test(t)).slice(0, 12).join(' | ');
  const schemaNodes = [...document.querySelectorAll('script[type="application/ld+json"]')];
  const schema = schemaNodes.map(s => s.textContent || '').join('\n').slice(0, 2500);
  const schemaTypes = (schema.match(/"@type"\s*:\s*"([^"]+)"/g) || []).slice(0, 8).join(',');
  const text = document.body?.innerText?.slice(0, 4500) || '';
  const prices = (text.match(/[\$€£¥₹]\s?\d+(?:[.,]\d+)?/g) || []).slice(0, 8).join(', ');
  const cartLinks = [...document.querySelectorAll('a[href*="cart"], a[href*="checkout"], a[href*="/shop"], a[href*="/product"]')]
    .slice(0, 6).map(a => a.getAttribute('href')).join(' | ');
  return {
    title: document.title || '',
    description: meta('description') || meta('og:description') || '',
    ogType: meta('og:type') || '',
    platform, buttons, schemaTypes, schema, prices, cartLinks, text,
  };
}

module.exports = { extract };
