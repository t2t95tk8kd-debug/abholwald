import http from 'node:http';
import { validateEvent, aggregate } from './service.js';
const events = new Map(); // DEVELOPMENT ONLY: ephemeral, not production-ready
const port = Number(process.env.PORT || 3000);
const token = process.env.ABHOLWALD_DEV_TOKEN;
if (!token) { console.error('Set ABHOLWALD_DEV_TOKEN for local development'); process.exit(1); }
const server = http.createServer(async (req,res) => {
 const respond = (status, obj) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(obj)); };
 if (req.method === 'GET' && req.url === '/health') return respond(200,{status:'ok',mode:'development'});
 if (req.method === 'GET' && req.url === '/v1/stats') return respond(200,aggregate([...events.values()]));
 if (req.method !== 'POST' || req.url !== '/v1/events') return respond(404,{error:'not_found'});
 if (req.headers.authorization !== `Bearer ${token}`) return respond(401,{error:'unauthorized'});
 let raw='';try { for await (const part of req) {raw+=part;if(raw.length>8192) return respond(413,{error:'too_large'});} const body=JSON.parse(raw);
 const error=validateEvent(body); if(error) return respond(422,{error});
 const prior=events.get(body.event_id);
 if(prior) return respond(prior.shop_id===body.shop_id && prior.event===body.event && prior.shipment_ref===body.shipment_ref?200:409,{status:prior.shop_id===body.shop_id && prior.event===body.event && prior.shipment_ref===body.shipment_ref?'duplicate':'conflict'});
 // A shipment only counts once per event type per shop.
 if ([...events.values()].some(e=>e.shop_id===body.shop_id&&e.shipment_ref===body.shipment_ref&&e.event===body.event))return respond(200,{status:'duplicate'});
 events.set(body.event_id,body);return respond(202,{status:'accepted'});
 } catch {return respond(400,{error:'invalid_json'});}
});
server.listen(port,()=>console.log(`Abholwald DEV API listening on ${port}`));
