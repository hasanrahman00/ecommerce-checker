function getProxy() {
  const server = process.env.PROXY_SERVER;
  if (!server) return null;
  const proxy = { server };
  if (process.env.PROXY_USERNAME) proxy.username = process.env.PROXY_USERNAME;
  if (process.env.PROXY_PASSWORD) proxy.password = process.env.PROXY_PASSWORD;
  if (process.env.PROXY_BYPASS) proxy.bypass = process.env.PROXY_BYPASS;
  return proxy;
}

function describeProxy() {
  const p = getProxy();
  if (!p) return 'no proxy';
  const auth = p.username ? `${p.username}@` : '';
  return `proxy ${auth}${p.server}`;
}

module.exports = { getProxy, describeProxy };
