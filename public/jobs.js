const streams = new Map();

function renderJobs(jobs) {
  const c = document.getElementById('jobs');
  c.innerHTML = '';
  if (!jobs.length) { c.appendChild(el('div', 'empty', 'No jobs yet. Upload a file to start.')); return; }
  jobs.sort((a,b) => b.createdAt - a.createdAt).forEach(j => {
    c.appendChild(jobCard(j));
    if (j.status === 'running' || j.status === 'queued') attachStream(j.id);
  });
}

function updateJobCard(id, processed, total, status) {
  const card = document.querySelector(`.job[data-id="${id}"]`);
  if (!card) return;
  const pct = total ? Math.round((processed / total) * 100) : 0;
  card.querySelector('.progress > div').style.width = pct + '%';
  card.querySelector('.counts').textContent = `${processed} / ${total}`;
  card.querySelector('.job-meta').innerHTML = `<span class="counts">${processed} / ${total}</span> rows · ${pct}%`;
  if (status) {
    const s = card.querySelector('.status');
    s.className = 'status ' + status;
    s.textContent = status;
  }
}

function attachStream(id) {
  if (streams.has(id)) return;
  const es = API.stream(id, (type, data) => {
    if (type === 'row') updateJobCard(id, data.processed, data.total);
    if (type === 'log') Logs.append(id, data);
    if (type === 'status') {
      updateJobCard(id, data.processed ?? 0, data.total ?? 0, data.status);
      if (['completed','stopped'].includes(data.status)) { es.close(); streams.delete(id); }
    }
  });
  streams.set(id, es);
}
