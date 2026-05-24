const Logs = (() => {
  const modal = document.getElementById('logs-modal');
  const body = document.getElementById('logs-body');
  const titleEl = document.getElementById('logs-title');
  const copyBtn = document.getElementById('logs-copy');
  const closeBtn = document.getElementById('logs-close');
  let activeId = null;

  function fmt(l) {
    const ts = new Date(l.t).toISOString().slice(11, 19);
    return `[${ts}] [${l.level.toUpperCase()}] ${l.msg}`;
  }
  function render(list) { body.textContent = list.map(fmt).join('\n') || '(no logs yet)'; }

  async function open(id, name) {
    activeId = id;
    titleEl.textContent = `Logs — ${name}`;
    modal.classList.add('show');
    const { logs } = await API.logs(id);
    render(logs || []);
    body.scrollTop = body.scrollHeight;
  }
  function close() { modal.classList.remove('show'); activeId = null; }
  function append(id, entry) {
    if (id !== activeId) return;
    body.textContent = (body.textContent === '(no logs yet)' ? '' : body.textContent + '\n') + fmt(entry);
    body.scrollTop = body.scrollHeight;
  }
  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(body.textContent || '');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1200);
  });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  return { open, append };
})();
