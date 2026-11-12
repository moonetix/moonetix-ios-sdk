// Token endpoint for the Moonetix iOS, Android, Flutter, React Native and Unity SDKs.
// POST /api/moonetix/session returns a fresh single-use offerwall token for the signed-in user.
// Node.js 22, no dependencies. Replace authenticate() with your own sign-in check.

import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const USER_ID = /^[A-Za-z0-9._@:+-]{1,100}$/;

function sameText(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Demo sign-in only: DEMO_SESSIONS="token1=user1,token2=user2". The app sends
// "Authorization: Bearer token1". In production, check your own session or JWT here and
// return the user ID from your database. Never take the user ID from the request body.
export function demoAuthenticate(sessionsText = process.env.DEMO_SESSIONS || '') {
  const sessions = sessionsText
    .split(',')
    .map((pair) => pair.trim().split('='))
    .filter(([token, userId]) => token && userId);
  return (req) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    const presented = header.slice(7).trim();
    let found = null;
    for (const [token, userId] of sessions) {
      if (sameText(token, presented)) found = userId;
    }
    return found;
  };
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

export function createServer({
  apiKey = process.env.MOONETIX_API_KEY,
  apiBase = process.env.MOONETIX_API_BASE || 'https://api.moonetix.com',
  authenticate = demoAuthenticate(),
  log = console,
} = {}) {
  if (!apiKey) throw new Error('MOONETIX_API_KEY is not set');

  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname !== '/api/moonetix/session') return send(res, 404, { error: 'not_found' });
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
    req.resume();

    const userId = authenticate(req);
    if (!userId) return send(res, 401, { error: 'sign_in_required' });
    if (!USER_ID.test(String(userId))) {
      log.error('Moonetix session: user ID has characters Moonetix does not accept');
      return send(res, 500, { error: 'offerwall_unavailable' });
    }

    try {
      const r = await fetch(`${apiBase}/v1/session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: String(userId) }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 201 && typeof data.token === 'string' && data.token) {
        return send(res, 200, { token: data.token });
      }
      log.warn('Moonetix session failed', r.status, data.error);
      return send(res, r.status === 403 ? 403 : 503, { error: 'offerwall_unavailable' });
    } catch (e) {
      log.warn('Moonetix session failed', e.name);
      return send(res, 503, { error: 'offerwall_unavailable' });
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => {
    console.log(`Token endpoint on http://localhost:${port}/api/moonetix/session`);
  });
}
