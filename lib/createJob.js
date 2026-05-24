const path = require('path');
const { genJobId } = require('./idGen');
const { parseFile } = require('./parseFile');
const { findWebsiteColumn } = require('./findColumn');
const { createAppender } = require('./csvAppender');
const store = require('./jobStore');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const EXTRA = ['SSL', 'IsCommerce', 'Niche', 'Category', 'ScrapeStatus'];

function createJob(filePath, originalName) {
  const rows = parseFile(filePath, originalName);
  if (!rows.length) throw new Error('Empty file');
  const websiteCol = findWebsiteColumn(rows);
  if (!websiteCol) throw new Error('No "Website" column found');
  const id = genJobId();
  const headers = [...Object.keys(rows[0]), ...EXTRA];
  const outputPath = path.join(OUTPUT_DIR, `${id}.csv`);
  const appender = createAppender(outputPath, headers, websiteCol);
  return store.create({
    id, name: originalName, filePath, rows, websiteCol,
    headers, appender, outputPath,
    total: rows.length, processed: 0, logs: [],
    status: 'queued', createdAt: Date.now(),
  });
}

module.exports = { createJob };
