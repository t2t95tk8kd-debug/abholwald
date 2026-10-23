// DEVELOPMENT ONLY: ephemeral in-memory store, lost on restart. Not production-ready.
export function createMemoryStore() {
  const byEventId = new Map();
  // A shipment only counts once per event type per shop.
  const semanticKeys = new Set();
  const semanticKey = (e) => JSON.stringify([e.shop_id, e.shipment_ref, e.event]);

  return {
    record(event) {
      const prior = byEventId.get(event.event_id);
      if (prior) return semanticKey(prior) === semanticKey(event) ? 'duplicate' : 'conflict';
      const key = semanticKey(event);
      if (semanticKeys.has(key)) return 'duplicate';
      byEventId.set(event.event_id, event);
      semanticKeys.add(key);
      return 'accepted';
    },
    events() {
      return [...byEventId.values()];
    },
  };
}
