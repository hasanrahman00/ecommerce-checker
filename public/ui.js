function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function jobCard(job) {
  const pct = job.total ? Math.round((job.processed / job.total) * 100) : 0;
  const wrap = el('div', 'job');
  wrap.dataset.id = job.id;
  wrap.innerHTML = `
    <div class="job-head">
      <div class="job-name">${escape(job.name || job.id)}</div>
      <span class="status ${job.status}">${job.status}</span>
    </div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="job-meta"><span class="counts">${job.processed} / ${job.total}</span> rows · ${pct}%</div>
    <div class="actions">
      <button class="btn primary sm" data-act="download">Download</button>
      <button class="btn ghost sm" data-act="logs">Logs</button>
      <button class="btn warn sm" data-act="stop">Stop</button>
      <button class="btn ghost sm" data-act="rerun">Re-run</button>
      <button class="btn danger sm" data-act="delete">Delete</button>
    </div>`;
  return wrap;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}
