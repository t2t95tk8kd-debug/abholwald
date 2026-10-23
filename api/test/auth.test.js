import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticate, loadCredentials } from '../src/auth.js';

const DEV = 'dev-token-0123456789abcdefghij';
const SHOP = 'shop-token-0123456789abcdefghij';

test('loads dev and shop-bound tokens', () => {
  const credentials = loadCredentials({ ABHOLWALD_DEV_TOKEN: DEV, ABHOLWALD_SHOP_TOKENS: `shop_1=${SHOP}` });
  assert.equal(authenticate(`Bearer ${DEV}`, credentials).shopId, null);
  assert.equal(authenticate(`Bearer ${SHOP}`, credentials).shopId, 'shop_1');
});
test('rejects missing, wrong and malformed authorization', () => {
  const credentials = loadCredentials({ ABHOLWALD_DEV_TOKEN: DEV });
  for (const header of [undefined, '', DEV, `Basic ${DEV}`, `Bearer ${DEV}x`, `Bearer ${DEV} extra`]) {
    assert.equal(authenticate(header, credentials), null, String(header));
  }
});
test('refuses missing, short and placeholder tokens', () => {
  assert.throws(() => loadCredentials({}), /Set ABHOLWALD_DEV_TOKEN/);
  assert.throws(() => loadCredentials({ ABHOLWALD_DEV_TOKEN: 'short' }), /at least/);
  assert.throws(() => loadCredentials({ ABHOLWALD_DEV_TOKEN: 'replace-with-long-random-development-token' }), /Replace/);
  assert.throws(() => loadCredentials({ ABHOLWALD_SHOP_TOKENS: `=${SHOP}` }), /Invalid/);
  assert.throws(() => loadCredentials({ ABHOLWALD_SHOP_TOKENS: SHOP }), /Invalid/);
});
