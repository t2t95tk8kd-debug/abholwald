const eventTypes = new Set(['ooh.booked']); // collected requires separately audited carrier evidence
export function validateEvent(e) {
 if(!e||typeof e!=='object'||Array.isArray(e))return 'invalid_event';
 if(!['event_id','shop_id','shipment_ref','event','occurred_at'].every(k=>typeof e[k]==='string'))return 'missing_field';
 if(!/^[A-Za-z0-9_-]{8,100}$/.test(e.event_id))return 'invalid_event_id';
 if(!/^[A-Za-z0-9_-]{3,80}$/.test(e.shop_id))return 'invalid_shop_id';
 if(!/^[A-Za-z0-9_-]{12,128}$/.test(e.shipment_ref))return 'invalid_shipment_ref';
 if(!eventTypes.has(e.event))return 'unsupported_event';
 if(!Number.isFinite(Date.parse(e.occurred_at)) || Math.abs(Date.now()-Date.parse(e.occurred_at))>7*86400000)return 'invalid_event_time';
 const allowed=new Set(['event_id','shop_id','shipment_ref','event','occurred_at','carrier','ooh_type']);
 if(Object.keys(e).some(k=>!allowed.has(k)))return 'unexpected_field';
 if(e.carrier!==undefined&&!['dhl','gls','dpd','other'].includes(e.carrier))return 'invalid_carrier';
 if(e.ooh_type!==undefined&&!['locker','parcel_shop'].includes(e.ooh_type))return 'invalid_ooh_type';
 return null;
}
export function aggregate(events){return {reported_ooh_bookings:events.filter(x=>x.event==='ooh.booked').length,verified_collections:0,virtual_trees_from_verified_collections:0,source:'development_events'};}
