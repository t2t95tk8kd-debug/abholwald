import { authenticate } from './auth.js';
import { aggregate, validateEvent } from './service.js';

const MAX_BODY_BYTES = 8192;
const STATUS_CODES = { accepted: 202, duplicate: 200, conflict: 409 };
const ROUTES = { '/health': 'GET', '/v1/stats': 'GET', '/v1/events': 'POST' };

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

async function readJson(req) {
  if (!/^application\/json\s*(;|$)/i.test(req.headers['content-type'] ?? '')) {
    throw new HttpError(415, 'unsupported_media_type');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

export function createApp({ credentials, store, now = Date.now, log = console }) {
  return async function handle(req, res) {
    const respond = (status, body, headers = {}) => {
      res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        ...headers,
      });
      res.end(JSON.stringify(body));
    };

    const { pathname } = new URL(req.url, 'http://localhost');
    const method = ROUTES[pathname];
    if (!method) return respond(404, { error: 'not_found' });
    if (req.method !== method) return respond(405, { error: 'method_not_allowed' }, { allow: method });

    if (pathname === '/health') return respond(200, { status: 'ok', mode: 'development' });
    if (pathname === '/v1/stats') return respond(200, aggregate(store.events()));

    const credential = authenticate(req.headers.authorization, credentials);
    if (!credential) return respond(401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });

    try {
      const body = await readJson(req);
      const error = validateEvent(body, now());
      if (error) return respond(422, { error });
      if (credential.shopId !== null && credential.shopId !== body.shop_id) {
        return respond(403, { error: 'shop_mismatch' });
      }
      const status = store.record(body);
      return respond(STATUS_CODES[status], { status });
    } catch (err) {
      if (err instanceof HttpError) return respond(err.status, { error: err.message }, { connection: 'close' });
      log.error(err);
      return respond(500, { error: 'internal_error' });
    }
  };
}
