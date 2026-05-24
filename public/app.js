async function refresh() {
  const jobs = await API.list();
  renderJobs(jobs);
}

document.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.closest('.job').dataset.id;
  const act = btn.dataset.act;
  if (act === 'download') return API.download(id);
  if (act === 'logs') {
    const name = btn.closest('.job').querySelector('.job-name').textContent;
    return Logs.open(id, name);
  }
  if (act === 'stop') { await API.stop(id); return refresh(); }
  if (act === 'rerun') { await API.rerun(id); return refresh(); }
  if (act === 'delete') {
    if (!confirm('Delete this job and its output?')) return;
    await API.remove(id); return refresh();
  }
});

document.getElementById('refresh-btn').addEventListener('click', refresh);
document.getElementById('delete-all-btn').addEventListener('click', async () => {
  if (!confirm('Delete ALL jobs and their output files?')) return;
  await API.removeAll();
  refresh();
});

initUpload(() => refresh());
refresh();
setInterval(refresh, 5000);
