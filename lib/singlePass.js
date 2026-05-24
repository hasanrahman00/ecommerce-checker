const { processRow } = require('./processor');
const store = require('./jobStore');
const sse = require('./sse');
const log = require('./logger');

const CONCURRENCY = parseInt(process.env.BATCH_SIZE || '10', 10);
const STAGGER_MS = parseInt(process.env.STAGGER_MS || '150', 10);

async function runSinglePass(jobId, job) {
  store.update(jobId, { status: 'running' });
  sse.broadcast(jobId, 'status', { status: 'running', processed: job.processed, total: job.total });
  const skipping = job.completed?.size || 0;
  log.info(jobId, `pass: ${job.total} rows, concurrency=${CONCURRENCY}${skipping ? `, skipping ${skipping} already done` : ''}`);

  let nextIdx = 0;
  const worker = async (slot) => {
    if (STAGGER_MS) await new Promise(r => setTimeout(r, slot * STAGGER_MS));
    while (nextIdx < job.rows.length) {
      if (store.get(jobId)?.status === 'stopped') return;
      const i = nextIdx++;
      const row = job.rows[i];
      const url = row[job.websiteCol];
      if (job.completed?.has(url)) continue;
      let out;
      try { out = await processRow(row, job.websiteCol, jobId, slot); }
      catch (e) {
        log.error(jobId, `row ${i + 1} crashed: ${e.message}`);
        out = { ...row, SSL: 'No', IsCommerce: 'Error', Niche: 'Error', Category: 'Error', ScrapeStatus: e.message.slice(0, 200) };
      }
      if (out === null) return;
      job.appender.append(out);
      job.processed++;
      store.touch();
      sse.broadcast(jobId, 'row', { processed: job.processed, total: job.total, row: out });
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, slot) => worker(slot)));
}

module.exports = { runSinglePass };
