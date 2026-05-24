const store = require('./jobStore');
const sse = require('./sse');

const MAX = 2000;

function log(jobId, level, msg) {
  const job = store.get(jobId);
  if (!job) return;
  if (!job.logs) job.logs = [];
  const entry = { t: Date.now(), level, msg: String(msg) };
  job.logs.push(entry);
  if (job.logs.length > MAX) job.logs.shift();
  sse.broadcast(jobId, 'log', entry);
}

const info  = (id, m) => log(id, 'info', m);
const warn  = (id, m) => log(id, 'warn', m);
const error = (id, m) => log(id, 'error', m);

module.exports = { log, info, warn, error };
