const store = require('./jobStore');
const sse = require('./sse');
const log = require('./logger');
const { hydrate } = require('./hydrate');
const { runSinglePass } = require('./singlePass');
const { resetBreaker } = require('./deepseek');

const PASSES = parseInt(process.env.RETRY_PASSES || '3', 10);
const COOLDOWN_MS = parseInt(process.env.RETRY_COOLDOWN_MS || '45000', 10);

async function runJob(jobId) {
  const job = store.get(jobId);
  if (!job) return;
  resetBreaker();

  for (let pass = 1; pass <= PASSES; pass++) {
    if (pass > 1) {
      try { hydrate(job); }
      catch (e) { log.error(jobId, `retry hydrate failed: ${e.message}`); break; }
      const remaining = job.total - (job.completed?.size || 0);
      if (remaining === 0) { log.info(jobId, `all rows succeeded after pass ${pass - 1}`); break; }
      log.info(jobId, `retry pass ${pass}/${PASSES}: ${remaining} failing rows, cooldown ${COOLDOWN_MS / 1000}s`);
      await new Promise(r => setTimeout(r, COOLDOWN_MS));
      if (store.get(jobId)?.status === 'stopped') break;
    }
    await runSinglePass(jobId, job);
    if (store.get(jobId)?.status === 'stopped') break;
  }

  const final = store.get(jobId)?.status === 'stopped' ? 'stopped' : 'completed';
  store.update(jobId, { status: final });
  log.info(jobId, `job ${final}: ${job.processed}/${job.total}`);
  sse.broadcast(jobId, 'status', { status: final, processed: job.processed, total: job.total });
}

module.exports = { runJob };
