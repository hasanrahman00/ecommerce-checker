const fs = require('fs');
const store = require('../lib/jobStore');

function deleteOne(req, res) {
  const job = store.get(req.params.id);
  if (job?.outputPath && fs.existsSync(job.outputPath)) fs.unlinkSync(job.outputPath);
  store.remove(req.params.id);
  res.json({ ok: true });
}

function deleteAll(_req, res) {
  for (const j of store.all()) {
    if (j.outputPath && fs.existsSync(j.outputPath)) fs.unlinkSync(j.outputPath);
    store.remove(j.id);
  }
  res.json({ ok: true });
}

module.exports = { deleteOne, deleteAll };
