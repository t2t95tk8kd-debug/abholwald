import test from 'node:test';import assert from 'node:assert/strict';import {validateEvent,aggregate} from '../src/service.js';
const valid=()=>({event_id:'event_123456',shop_id:'shop_1',shipment_ref:'opaque_reference_123',event:'ooh.booked',occurred_at:new Date().toISOString()});
test('accepts minimal booking',()=>assert.equal(validateEvent(valid()),null));
test('rejects customer fields',()=>assert.equal(validateEvent({...valid(),email:'a@b.test'}),'unexpected_field'));
test('rejects unverified collected events',()=>assert.equal(validateEvent({...valid(),event:'ooh.collected'}),'unsupported_event'));
test('distinguishes booking from collection',()=>assert.deepEqual(aggregate([valid()]),{reported_ooh_bookings:1,verified_collections:0,virtual_trees_from_verified_collections:0,source:'development_events'}));
