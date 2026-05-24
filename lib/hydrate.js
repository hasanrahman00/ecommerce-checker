const fs = require('fs');
const { parseFile } = require('./parseFile');
const { createAppender } = require('./csvAppender');

function isSuccess(row) {
  const s = String(row.ScrapeStatus || '').toLowerCase();
  if (s !== 'ok' && s !== 'skipped') return false;
  const c = String(row.IsCommerce || '');
  return c === 'Yes' || c === 'No' || c === 'Invalid URL';
}

function hydrate(job) {
  if (!job.rows) {
    if (!job.filePath || !fs.existsSync(job.filePath)) {
      throw new Error('Original upload no longer available; cannot rerun');
    }
    job.rows = parseFile(job.filePath, job.name);
  }
  if (!job.logs) job.logs = [];

  const inputUrls = new Set(job.rows.map(r => r[job.websiteCol]));
  const allExisting = [];
  job.completed = new Map();

  if (fs.existsSync(job.outputPath)) {
    let existing = [];
    try { existing = parseFile(job.outputPath); } catch { existing = []; }
    for (const r of existing) {
      const url = r[job.websiteCol];
      if (!inputUrls.has(url)) continue;
      allExisting.push(r);
      if (isSuccess(r)) job.completed.set(url, r);
    }
  }

  job.appender = createAppender(job.outputPath, job.headers, job.websiteCol);
  if (allExisting.length) job.appender.preload(allExisting);
  job.processed = job.completed.size;
}

module.exports = { hydrate };
