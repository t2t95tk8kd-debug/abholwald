import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { loadCredentials } from '../src/auth.js';
import { createMemoryStore } from '../src/store.js';

const DEV = 'dev-token-0123456789abcdefghij';
const SHOP = 'shop-token-0123456789abcdefghij';
const NOW = Date.parse('2026-10-23T12:00:00Z');
let server;
let base;

before(async () => {
  const credentials = loadCredentials({ ABHOLWALD_DEV_TOKEN: DEV, ABHOLWALD_SHOP_TOKENS: `shop_1=${SHOP}` });
  server = http.createServer(createApp({ credentials, store: createMemoryStore(), now: () => NOW }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

let counter = 0;
const booking = (overrides = {}) => ({
  event_id: `event_${String(++counter).padStart(6, '0')}`,
  shop_id: 'shop_1',
  shipment_ref: `opaque_reference_${counter}`,
  event: 'ooh.booked',
  occurred_at: '2026-10-23T09:00:00Z',
  ...overrides,
});
const post = (body, { token = DEV, type = 'application/json' } = {}) =>
  fetch(`${base}/v1/events`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': type },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const json = async (res) => ({ status: res.status, body: await res.json() });

test('health and routing', async () => {
  assert.deepEqual(await json(await fetch(`${base}/health`)), { status: 200, body: { status: 'ok', mode: 'development' } });
  assert.equal((await fetch(`${base}/v1/stats?cache=1`)).status, 200);
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  const res = await fetch(`${base}/v1/events`);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'POST');
});

test('accepts a booking and counts it in stats', async () => {
  const before = (await json(await fetch(`${base}/v1/stats`))).body.reported_ooh_bookings;
  assert.deepEqual(await json(await post(booking())), { status: 202, body: { status: 'accepted' } });
  assert.equal((await json(await fetch(`${base}/v1/stats`))).body.reported_ooh_bookings, before + 1);
});

test('idempotency: exact repeat, semantic duplicate and conflict', async () => {
  const event = booking();
  assert.equal((await post(event)).status, 202);
  assert.deepEqual(await json(await post(event)), { status: 200, body: { status: 'duplicate' } });
  const sameShipment = { ...event, event_id: 'event_other_id' };
  assert.deepEqual(await json(await post(sameShipment)), { status: 200, body: { status: 'duplicate' } });
  const collision = { ...event, shipment_ref: 'another_reference_1' };
  assert.deepEqual(await json(await post(collision)), { status: 409, body: { status: 'conflict' } });
});

test('rejects unauthenticated requests', async () => {
  const res = await post(booking(), { token: 'wrong-token-0123456789abcdef' });
  assert.equal(res.status, 401);
  assert.equal(res.headers.get('www-authenticate'), 'Bearer');
});

test('shop-bound token may only report for its own shop', async () => {
  assert.equal((await post(booking(), { token: SHOP })).status, 202);
  assert.deepEqual(await json(await post(booking({ shop_id: 'shop_2' }), { token: SHOP })), {
    status: 403,
    body: { error: 'shop_mismatch' },
  });
});

test('rejects bad payloads', async () => {
  assert.deepEqual(await json(await post('{nope')), { status: 400, body: { error: 'invalid_json' } });
  assert.equal((await post(booking(), { type: 'text/plain' })).status, 415);
  assert.deepEqual(await json(await post(booking({ email: 'a@b.test' }))), { status: 422, body: { error: 'unexpected_field' } });
  assert.equal((await post({ ...booking(), pad: 'ü'.repeat(5000) })).status, 413);
});
