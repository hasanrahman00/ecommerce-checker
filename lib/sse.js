const clients = new Map();

function addClient(jobId, res) {
  if (!clients.has(jobId)) clients.set(jobId, new Set());
  clients.get(jobId).add(res);
  res.on('close', () => removeClient(jobId, res));
}

function removeClient(jobId, res) {
  const set = clients.get(jobId);
  if (set) { set.delete(res); if (!set.size) clients.delete(jobId); }
}

function broadcast(jobId, event, data) {
  const set = clients.get(jobId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) res.write(payload);
}

module.exports = { addClient, broadcast };
