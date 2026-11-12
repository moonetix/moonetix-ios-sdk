import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createServer, demoAuthenticate } from '../server.mjs';

const API_KEY = 'test_api_key_not_secret';
const TOKEN = 'sst_' + 'A'.repeat(43);
const quiet = { warn() {}, error() {} };

// A stand-in for api.moonetix.com that records what it receives.
async function fakeMoonetix(reply) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: JSON.parse(body || '{}') });
      const [status, json] = reply();
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    });
  });
  server.listen(0);
  await once(server, 'listening');
  return { server, calls, base: `http://127.0.0.1:${server.address().port}` };
}

async function start(apiBase, sessions = 'app-session-1=user_42') {
  const server = createServer({ apiKey: API_KEY, apiBase, authenticate: demoAuthenticate(sessions), log: quiet });
  server.listen(0);
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}/api/moonetix/session` };
}

test('returns only the token, for the signed-in user', async (t) => {
  const api = await fakeMoonetix(() => [201, { ok: true, token: TOKEN, expires_in: 600 }]);
  const app = await start(api.base);
  t.after(() => { api.server.close(); app.server.close(); });

  const res = await fetch(app.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer app-session-1', 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'someone_else' }),
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await res.json(), { token: TOKEN });
  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].method, 'POST');
  assert.equal(api.calls[0].url, '/v1/session');
  assert.equal(api.calls[0].auth, `Bearer ${API_KEY}`);
  assert.deepEqual(api.calls[0].body, { user_id: 'user_42' });
});

test('401 without a valid sign-in, and Moonetix is not called', async (t) => {
  const api = await fakeMoonetix(() => [201, { ok: true, token: TOKEN }]);
  const app = await start(api.base);
  t.after(() => { api.server.close(); app.server.close(); });

  for (const headers of [{}, { Authorization: 'Bearer wrong' }, { Authorization: 'app-session-1' }]) {
    const res = await fetch(app.url, { method: 'POST', headers });
    assert.equal(res.status, 401);
  }
  assert.equal(api.calls.length, 0);
});

test('403 from Moonetix becomes 403, so the app can hide Earn', async (t) => {
  const api = await fakeMoonetix(() => [403, { ok: false, error: 'user_blocked' }]);
  const app = await start(api.base);
  t.after(() => { api.server.close(); app.server.close(); });

  const res = await fetch(app.url, { method: 'POST', headers: { Authorization: 'Bearer app-session-1' } });
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { error: 'offerwall_unavailable' });
});

test('other upstream errors become 503 and never leak details', async (t) => {
  for (const reply of [[401, { error: 'invalid_api_key' }], [429, { error: 'rate_limited' }], [500, {}], [201, { ok: true }]]) {
    const api = await fakeMoonetix(() => reply);
    const app = await start(api.base);
    const res = await fetch(app.url, { method: 'POST', headers: { Authorization: 'Bearer app-session-1' } });
    assert.equal(res.status, 503, `upstream ${reply[0]}`);
    assert.deepEqual(await res.json(), { error: 'offerwall_unavailable' });
    api.server.close();
    app.server.close();
  }
});

test('503 when Moonetix cannot be reached', async (t) => {
  const app = await start('http://127.0.0.1:1');
  t.after(() => app.server.close());
  const res = await fetch(app.url, { method: 'POST', headers: { Authorization: 'Bearer app-session-1' } });
  assert.equal(res.status, 503);
});

test('only POST on the session path', async (t) => {
  const api = await fakeMoonetix(() => [201, { ok: true, token: TOKEN }]);
  const app = await start(api.base);
  t.after(() => { api.server.close(); app.server.close(); });

  assert.equal((await fetch(app.url, { headers: { Authorization: 'Bearer app-session-1' } })).status, 405);
  assert.equal((await fetch(app.url.replace('/session', '/other'), { method: 'POST' })).status, 404);
  assert.equal(api.calls.length, 0);
});

test('refuses to start without an API key', () => {
  assert.throws(() => createServer({ apiKey: '' }), /MOONETIX_API_KEY/);
});
