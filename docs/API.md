# Event API v1 (local development contract)

`POST /v1/events` with `Authorization: Bearer <shop-token>`, `Content-Type: application/json` and at most 8 KiB of JSON:

```json
{"event_id":"event_123456","shop_id":"shop_1","shipment_ref":"opaque_reference_123","event":"ooh.booked","carrier":"dhl","ooh_type":"locker","occurred_at":"2026-10-23T09:00:00Z"}
```

| Field | Required | Rule |
|---|---|---|
| `event_id` | yes | `[A-Za-z0-9_-]{8,100}`, stable per event (idempotency key) |
| `shop_id` | yes | `[A-Za-z0-9_-]{3,80}` |
| `shipment_ref` | yes | `[A-Za-z0-9_-]{12,128}`, opaque and shop-scoped, **no plain tracking number** |
| `event` | yes | only `ooh.booked` |
| `occurred_at` | yes | RFC 3339 with time zone, at most 7 days old and at most 5 minutes in the future |
| `carrier` | no | `dhl`, `gls`, `dpd`, `other` |
| `ooh_type` | no | `locker`, `parcel_shop` |

Any other field is rejected with `unexpected_field`, so customer data cannot slip into the event store.

## Responses

| Status | Body | Meaning |
|---|---|---|
| `202` | `{"status":"accepted"}` | stored |
| `200` | `{"status":"duplicate"}` | exact repeat of an `event_id`, or the same shop/shipment/event already reported |
| `409` | `{"status":"conflict"}` | `event_id` reused with different content |
| `400` | `{"error":"invalid_json"}` | body is not JSON |
| `401` | `{"error":"unauthorized"}` | missing or unknown token |
| `403` | `{"error":"shop_mismatch"}` | shop-bound token used for another `shop_id` |
| `405` | `{"error":"method_not_allowed"}` | wrong method, see `Allow` header |
| `413` | `{"error":"too_large"}` | body above 8 KiB |
| `415` | `{"error":"unsupported_media_type"}` | content type is not `application/json` |
| `422` | `{"error":"<code>"}` | validation failed (`missing_field`, `invalid_event_time`, …) |

`GET /v1/stats` returns a development aggregate. `GET /health` returns `{"status":"ok"}`.

## Credentials (development)

- `ABHOLWALD_DEV_TOKEN`: one unbound token for testing, may report for any shop.
- `ABHOLWALD_SHOP_TOKENS=shop_1=<token>,shop_2=<token>`: tokens bound to one `shop_id` each; a mismatch returns `403`.

Tokens must be at least 24 characters and are compared in constant time. The server binds to `127.0.0.1` by default and keeps everything in memory: no database, no rate limiting; **do not expose it to the Internet**.

Production acceptance criteria: issued per-tenant credentials (derive shop_id from auth), signed/replay-protected events, transactional durable idempotency, PostgreSQL and retention schedule, queues and retries, abuse protection, verified evidence for `ooh.collected`, system tests and privacy/legal review. Mere OOH selection is not delivery or collection.
