const persist = require('./persist');

const jobs = new Map();
let saveTimer = null;

function flush() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    persist.save(Array.from(jobs.values()));
    saveTimer = null;
  }, 200);
}

function flushSync() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  persist.save(Array.from(jobs.values()));
}

function create(job) { jobs.set(job.id, job); flushSync(); return job; }
function get(id) { return jobs.get(id); }
function update(id, patch) {
  const j = jobs.get(id);
  if (j) { Object.assign(j, patch); flushSync(); }
  return j;
}
function remove(id) { const r = jobs.delete(id); flushSync(); return r; }
function all() {
  return Array.from(jobs.values()).map(j => ({
    id: j.id, name: j.name, status: j.status,
    total: j.total, processed: j.processed,
    createdAt: j.createdAt, outputPath: j.outputPath,
  }));
}
function load() {
  for (const j of persist.load()) {
    if (j.status === 'running' || j.status === 'queued') j.status = 'interrupted';
    jobs.set(j.id, j);
  }
}
function touch() { flush(); }
function clear() { jobs.clear(); flushSync(); }

module.exports = { create, get, all, update, remove, load, clear, touch, flushSync };
