# Event API v1 (local development contract)

`POST /v1/events` with `Authorization: Bearer <shop-token>` and JSON:

```json
{"event_id":"event_123456","shop_id":"shop_1","shipment_ref":"opaque_reference_123","event":"ooh.booked","carrier":"dhl","ooh_type":"locker","occurred_at":"2026-10-23T09:00:00Z"}
```

Accepted: `202`. Exact repeats: `200`; collision: `409`. Invalid: `422`. Unauthorized: `401`.

`GET /v1/stats` returns a development aggregate. The local development server currently has a **single token for testing**, no database, no per-shop credential enforcement and no rate limiting; **do not expose it to the Internet**.

Production acceptance criteria: per-tenant credential binding (derive shop_id from auth), signed/replay-protected events, transactional durable idempotency, PostgreSQL and retention schedule, queues and retries, abuse protection, verified evidence for `ooh.collected`, system tests and privacy/legal review. Mere OOH selection is not delivery or collection.
