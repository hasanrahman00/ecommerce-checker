const express = require('express');
const store = require('../lib/jobStore');
const { addClient } = require('../lib/sse');
const { rerunHandler } = require('./rerun');
const { deleteOne, deleteAll } = require('./deletes');

const router = express.Router();
const notFound = (res) => res.status(404).json({ error: 'Not found' });

router.get('/jobs', (_req, res) => res.json(store.all()));

router.post('/jobs/:id/stop', (req, res) => {
  const j = store.update(req.params.id, { status: 'stopped' });
  return j ? res.json({ ok: true }) : notFound(res);
});

router.post('/jobs/:id/rerun', rerunHandler);
router.delete('/jobs/all', deleteAll);
router.delete('/jobs/:id', deleteOne);

router.get('/jobs/:id/logs', (req, res) => {
  const j = store.get(req.params.id);
  return j ? res.json({ logs: j.logs || [] }) : notFound(res);
});

router.get('/jobs/:id/download', (req, res) => {
  const j = store.get(req.params.id);
  return j ? res.download(j.outputPath, `result-${j.name || j.id}.csv`) : notFound(res);
});

router.get('/jobs/:id/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  const j = store.get(req.params.id);
  if (j) res.write(`event: status\ndata: ${JSON.stringify({ status: j.status, processed: j.processed, total: j.total })}\n\n`);
  addClient(req.params.id, res);
});

module.exports = router;
