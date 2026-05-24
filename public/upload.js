function initUpload(onUploaded) {
  const form = document.getElementById('upload-form');
  const input = document.getElementById('file');
  const drop = document.getElementById('drop');
  const text = document.getElementById('drop-text');
  const btn = document.getElementById('submit-btn');
  const err = document.getElementById('upload-error');

  drop.addEventListener('click', () => input.click());
  ['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('over');
  }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('over');
  }));
  drop.addEventListener('drop', e => { input.files = e.dataTransfer.files; show(); });
  input.addEventListener('change', show);

  function show() {
    if (input.files[0]) { text.textContent = input.files[0].name; btn.disabled = false; }
  }
  function setErr(msg) { err.textContent = msg || ''; err.style.display = msg ? 'block' : 'none'; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!input.files[0]) return;
    setErr(''); btn.disabled = true; btn.textContent = 'Uploading...';
    try {
      const r = await API.upload(input.files[0]);
      input.value = ''; text.textContent = 'Drop file here or browse';
      btn.disabled = true;
      onUploaded(r);
    } catch (e) {
      setErr(e.message || 'Upload failed');
      btn.disabled = !input.files[0];
    } finally {
      btn.textContent = 'Start Job';
    }
  });
}
