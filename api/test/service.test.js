import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent, aggregate } from '../src/service.js';

const NOW = Date.parse('2026-10-23T12:00:00Z');
const valid = () => ({
  event_id: 'event_123456',
  shop_id: 'shop_1',
  shipment_ref: 'opaque_reference_123',
  event: 'ooh.booked',
  occurred_at: '2026-10-23T09:00:00Z',
});

test('accepts minimal booking', () => assert.equal(validateEvent(valid(), NOW), null));
test('accepts optional carrier and ooh_type', () =>
  assert.equal(validateEvent({ ...valid(), carrier: 'dhl', ooh_type: 'locker' }, NOW), null));
test('rejects customer fields', () => assert.equal(validateEvent({ ...valid(), email: 'a@b.test' }, NOW), 'unexpected_field'));
test('rejects customer fields even if required fields are missing', () =>
  assert.equal(validateEvent({ address: 'Hauptstr. 1' }, NOW), 'unexpected_field'));
test('rejects unverified collected events', () =>
  assert.equal(validateEvent({ ...valid(), event: 'ooh.collected' }, NOW), 'unsupported_event'));
test('rejects non-objects', () => {
  for (const input of [null, [], 'x', 1]) assert.equal(validateEvent(input, NOW), 'invalid_event');
});
test('rejects missing fields', () => {
  const { occurred_at, ...rest } = valid();
  assert.equal(validateEvent(rest, NOW), 'missing_field');
});
test('rejects invalid identifiers', () => {
  assert.equal(validateEvent({ ...valid(), event_id: 'short' }, NOW), 'invalid_event_id');
  assert.equal(validateEvent({ ...valid(), shop_id: 'a b c' }, NOW), 'invalid_shop_id');
  assert.equal(validateEvent({ ...valid(), shipment_ref: 'too_short' }, NOW), 'invalid_shipment_ref');
});
test('rejects ambiguous or out-of-range timestamps', () => {
  for (const occurred_at of ['2026', '2026-10-23', '2026-10-23T09:00:00', 'Oct 23 2026', '2026-10-22T25:00:00Z']) {
    assert.equal(validateEvent({ ...valid(), occurred_at }, NOW), 'invalid_event_time', occurred_at);
  }
  assert.equal(validateEvent({ ...valid(), occurred_at: '2026-10-15T09:00:00Z' }, NOW), 'invalid_event_time');
  assert.equal(validateEvent({ ...valid(), occurred_at: '2026-10-23T12:10:00Z' }, NOW), 'invalid_event_time');
  assert.equal(validateEvent({ ...valid(), occurred_at: '2026-10-23T14:02:00+02:00' }, NOW), null);
});
test('rejects unknown carrier and ooh_type', () => {
  assert.equal(validateEvent({ ...valid(), carrier: 'ups' }, NOW), 'invalid_carrier');
  assert.equal(validateEvent({ ...valid(), ooh_type: 'home' }, NOW), 'invalid_ooh_type');
});
test('distinguishes booking from collection', () =>
  assert.deepEqual(aggregate([valid()]), {
    reported_ooh_bookings: 1,
    verified_collections: 0,
    virtual_trees_from_verified_collections: 0,
    source: 'development_events',
  }));
