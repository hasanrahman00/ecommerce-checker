const { normalizeUrl } = require('./findColumn');
const { checkSSL } = require('./sslCheck');
const { scrapeUrl } = require('./scraper');
const { classifyWebsite } = require('./deepseek');
const { categorize } = require('./categorize');
const store = require('./jobStore');
const log = require('./logger');

const stopped = (jobId) => store.get(jobId)?.status === 'stopped';

async function processRow(row, websiteCol, jobId, slot = 0) {
  const raw = row[websiteCol];
  const url = normalizeUrl(raw);
  if (!url) {
    log.warn(jobId, `skip invalid url: "${raw}"`);
    return { ...row, SSL: 'No', IsCommerce: 'Invalid URL', Niche: 'Invalid URL', Category: 'N/A', ScrapeStatus: 'skipped' };
  }
  if (stopped(jobId)) return null;
  log.info(jobId, `processing ${url}`);
  const [sslR, scrape] = await Promise.all([checkSSL(url), scrapeUrl(url, slot)]);
  if (stopped(jobId)) return null;
  const ssl = sslR.ssl;
  log.info(jobId, `${url} ssl=${ssl} (${sslR.reason}) scrape=${scrape.ok ? 'ok' : 'fail'} platform="${scrape.platform || ''}"`);
  if (!scrape.ok) {
    log.error(jobId, `scrape failed ${url}: ${scrape.error}`);
    return { ...row, SSL: ssl, IsCommerce: 'Failed', Niche: 'Failed', Category: 'Failed', ScrapeStatus: scrape.error || 'failed' };
  }
  const cls = await classifyWebsite({ url, ...scrape });
  if (stopped(jobId)) return null;
  const extra = `${scrape.title} ${scrape.description} ${(scrape.text || '').slice(0, 500)}`;
  const category = cls.isCommerce === 'Yes' ? categorize(cls.category, cls.niche, extra) : 'N/A';
  if (cls.error) log.error(jobId, `deepseek error ${url}: ${cls.error}`);
  else log.info(jobId, `${url} → commerce=${cls.isCommerce} niche="${cls.niche}" ai_cat="${cls.category}" final_cat="${category}"`);
  return { ...row, SSL: ssl, IsCommerce: cls.isCommerce, Niche: cls.niche, Category: category,
           ScrapeStatus: cls.error ? `ai:${cls.error}` : 'ok' };
}

module.exports = { processRow };
