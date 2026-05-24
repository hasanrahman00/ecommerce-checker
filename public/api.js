async function jsonFetch(url, opts) {
  const r = await fetch(url, opts);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const t = await r.text();
    throw new Error(`Server returned ${r.status} ${r.statusText}: ${t.slice(0, 120)}`);
  }
  const data = await r.json();
  if (!r.ok && data.error) throw new Error(data.error);
  return data;
}

const API = {
  upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    return jsonFetch('/api/upload', { method: 'POST', body: fd });
  },
  list()       { return jsonFetch('/api/jobs'); },
  stop(id)     { return jsonFetch(`/api/jobs/${id}/stop`, { method: 'POST' }); },
  rerun(id)    { return jsonFetch(`/api/jobs/${id}/rerun`, { method: 'POST' }); },
  remove(id)   { return jsonFetch(`/api/jobs/${id}`, { method: 'DELETE' }); },
  removeAll()  { return jsonFetch('/api/jobs/all', { method: 'DELETE' }); },
  logs(id)     { return jsonFetch(`/api/jobs/${id}/logs`); },
  download(id) { window.location.href = `/api/jobs/${id}/download`; },
  stream(id, onEvent) {
    const es = new EventSource(`/api/jobs/${id}/stream`);
    es.addEventListener('row',    e => onEvent('row',    JSON.parse(e.data)));
    es.addEventListener('status', e => onEvent('status', JSON.parse(e.data)));
    es.addEventListener('log',    e => onEvent('log',    JSON.parse(e.data)));
    return es;
  },
};
