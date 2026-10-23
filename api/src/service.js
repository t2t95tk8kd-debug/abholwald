// `ooh.collected` requires separately audited carrier evidence and is not accepted yet.
const EVENT_TYPES = new Set(['ooh.booked']);
const CARRIERS = new Set(['dhl', 'gls', 'dpd', 'other']);
const OOH_TYPES = new Set(['locker', 'parcel_shop']);
const REQUIRED_FIELDS = ['event_id', 'shop_id', 'shipment_ref', 'event', 'occurred_at'];
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, 'carrier', 'ooh_type']);
const MAX_EVENT_AGE_MS = 7 * 86_400_000;
const MAX_CLOCK_SKEW_MS = 5 * 60_000;
// RFC 3339 timestamp with mandatory time zone, e.g. 2026-10-23T09:00:00Z.
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

export const SHOP_ID_PATTERN = /^[A-Za-z0-9_-]{3,80}$/;

export function validateEvent(e, now = Date.now()) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return 'invalid_event';
  if (Object.keys(e).some((k) => !ALLOWED_FIELDS.has(k))) return 'unexpected_field';
  if (!REQUIRED_FIELDS.every((k) => typeof e[k] === 'string')) return 'missing_field';
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(e.event_id)) return 'invalid_event_id';
  if (!SHOP_ID_PATTERN.test(e.shop_id)) return 'invalid_shop_id';
  if (!/^[A-Za-z0-9_-]{12,128}$/.test(e.shipment_ref)) return 'invalid_shipment_ref';
  if (!EVENT_TYPES.has(e.event)) return 'unsupported_event';
  const occurredAt = RFC3339.test(e.occurred_at) ? Date.parse(e.occurred_at) : NaN;
  if (!Number.isFinite(occurredAt)) return 'invalid_event_time';
  if (occurredAt > now + MAX_CLOCK_SKEW_MS || occurredAt < now - MAX_EVENT_AGE_MS) return 'invalid_event_time';
  if (e.carrier !== undefined && !CARRIERS.has(e.carrier)) return 'invalid_carrier';
  if (e.ooh_type !== undefined && !OOH_TYPES.has(e.ooh_type)) return 'invalid_ooh_type';
  return null;
}

export function aggregate(events) {
  return {
    reported_ooh_bookings: events.filter((x) => x.event === 'ooh.booked').length,
    verified_collections: 0,
    virtual_trees_from_verified_collections: 0,
    source: 'development_events',
  };
}
