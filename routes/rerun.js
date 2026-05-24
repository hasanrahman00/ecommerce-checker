const fs = require('fs');
const store = require('../lib/jobStore');
const { runJob } = require('../lib/batchRunner');
const { hydrate } = require('../lib/hydrate');

function rerunHandler(req, res) {
  const job = store.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (req.query.force === 'true') {
    job.completed = new Map();
    if (fs.existsSync(job.outputPath)) fs.unlinkSync(job.outputPath);
  }
  try { hydrate(job); } catch (e) { return res.status(400).json({ error: e.message }); }
  job.logs = [];
  runJob(job.id).catch(err => console.error('Rerun error:', err));
  res.json({
    ok: true,
    skipped: job.completed?.size || 0,
    remaining: job.total - (job.completed?.size || 0),
  });
}

module.exports = { rerunHandler };
