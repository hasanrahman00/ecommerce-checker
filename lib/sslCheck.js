const tls = require('tls');

function attempt(host) {
  return new Promise((resolve) => {
    let done = false;
    const settle = (v) => { if (!done) { done = true; resolve(v); } };
    const sock = tls.connect({
      host, port: 443, servername: host,
      timeout: 12000, rejectUnauthorized: true,
      ALPNProtocols: ['h2', 'http/1.1'],
    });
    sock.once('secureConnect', () => { settle({ ok: sock.authorized, err: sock.authorizationError }); sock.destroy(); });
    sock.once('error', (e) => settle({ ok: false, err: e.code || e.message }));
    sock.once('timeout', () => { sock.destroy(); settle({ ok: false, err: 'timeout' }); });
  });
}

async function checkSSL(urlStr) {
  let host;
  try { host = new URL(urlStr).hostname; } catch { return { ssl: 'No', reason: 'invalid url' }; }
  const r = await attempt(host);
  if (r.ok) return { ssl: 'Yes', reason: host };
  const alt = host.startsWith('www.') ? host.slice(4) : 'www.' + host;
  const r2 = await attempt(alt);
  if (r2.ok) return { ssl: 'Yes', reason: alt };
  return { ssl: 'No', reason: `${host}: ${r.err}; ${alt}: ${r2.err}` };
}

module.exports = { checkSSL };
