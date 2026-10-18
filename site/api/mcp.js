// Proxy /mcp to Apify's hosted MCP server. Actor list lives in site/mcp-tools.json (copied to /mcp-tools.json).
export const config = { runtime: 'edge' };
const UPSTREAM = 'https://mcp.apify.com/';
const PASS = ['authorization', 'content-type', 'accept', 'mcp-session-id', 'mcp-protocol-version', 'last-event-id'];
let TOOLS = null;
let STATIC = null;
const OPEN = new Set(['initialize', 'notifications/initialized', 'tools/list', 'resources/list', 'prompts/list', 'ping']);
export default async function handler(req) {
  const url = new URL(req.url);
  const prm = `${url.origin}/.well-known/oauth-protected-resource/mcp`;
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  if (!TOOLS) TOOLS = await (await fetch(`${url.origin}/mcp-tools.json`)).json();
  const up = new URL(UPSTREAM);
  up.searchParams.set('tools', TOOLS.join(','));
  const h = new Headers();
  for (const k of PASS) { const v = req.headers.get(k); if (v) h.set(k, v); }
  let body;
  if (!['GET', 'HEAD'].includes(req.method)) body = await req.text();
  if (!h.get('authorization') && req.method === 'POST') {
    let msg = null; try { msg = JSON.parse(body); } catch (e) {}
    const msgs = Array.isArray(msg) ? msg : (msg ? [msg] : []);
    if (msgs.length && msgs.every(m => m && OPEN.has(m.method))) {
      if (!STATIC) STATIC = await (await fetch(`${url.origin}/mcp-static.json`)).json();
      const res = msgs.filter(m => m.id !== undefined).map(m => ({ jsonrpc: '2.0', id: m.id, result: local(m) }));
      if (!res.length) return new Response(null, { status: 202, headers: cors() });
      return new Response(JSON.stringify(Array.isArray(msg) ? res : res[0]), { status: 200, headers: { ...cors(), 'content-type': 'application/json' } });
    }
  }
  if (!h.get('authorization')) {
    return new Response(JSON.stringify({ error: 'invalid_token', error_description: 'Authenticate with your Apify account (OAuth) or pass an Apify API token as Authorization: Bearer <token>.' }), {
      status: 401, headers: { ...cors(), 'content-type': 'application/json', 'www-authenticate': `Bearer realm="OAuth", resource_metadata="${prm}", error="invalid_token"` } });
  }
  const r = await fetch(up, { method: req.method, headers: h, body });
  const out = new Headers(r.headers);
  for (const [k, v] of Object.entries(cors())) out.set(k, v);
  if (r.status === 401) out.set('www-authenticate', `Bearer realm="OAuth", resource_metadata="${prm}", error="invalid_token"`);
  out.delete('content-encoding'); out.delete('content-length');
  return new Response(r.body, { status: r.status, headers: out });
}
function local(m) {
  if (m.method === 'initialize') return STATIC.initialize;
  if (m.method === 'tools/list') return { tools: STATIC.tools };
  if (m.method === 'resources/list') return { resources: [] };
  if (m.method === 'prompts/list') return { prompts: [] };
  return {};
}
function cors() {
  return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-Id',
    'access-control-expose-headers': 'Mcp-Session-Id, WWW-Authenticate, Last-Event-Id, Mcp-Protocol-Version' };
}
