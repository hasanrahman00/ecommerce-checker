require('dotenv').config();
const express = require('express');
const path = require('path');
const uploadRouter = require('./routes/upload');
const jobsRouter = require('./routes/jobs');
const store = require('./lib/jobStore');
const { warmUp, closeAll, getBrowser, POOL_SIZE } = require('./lib/browserPool');

const app = express();
const PORT = process.env.PORT || 3005;

store.load();

(async () => {
  try { await warmUp(); console.log(`[startup] browser pool OK (${POOL_SIZE} browsers)`); }
  catch (e) { console.error('[startup] BROWSER FAILED:', e.message); console.error('[startup] Run: npx playwright install chromium'); }
})();

app.get('/api/healthcheck', async (_req, res) => {
  try { await getBrowser(0); res.json({ ok: true, browser: 'ready', pool: POOL_SIZE }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false, lastModified: false, maxAge: 0,
  setHeaders: (res) => { res.set('Cache-Control', 'no-store, must-revalidate'); },
}));
app.use('/api', uploadRouter);
app.use('/api', jobsRouter);

app.use('/api/*', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));
app.use('/api', (err, _req, res, _next) => res.status(err.status || 500).json({ error: err.message }));

const server = app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

function shutdown(sig) {
  console.log(`\n[${sig}] flushing state and shutting down...`);
  try { store.flushSync(); console.log('[shutdown] state saved to jobs/jobs.json'); }
  catch (e) { console.error('[shutdown] flush failed:', e.message); }
  closeAll().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGBREAK', () => shutdown('SIGBREAK'));
