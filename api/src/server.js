import http from 'node:http';
import { createApp } from './app.js';
import { loadCredentials } from './auth.js';
import { createMemoryStore } from './store.js';

let credentials;
try {
  credentials = loadCredentials(process.env);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const port = Number(process.env.PORT || 3000);
// Bind to loopback by default: the development server must not be exposed to the Internet.
const host = process.env.HOST || '127.0.0.1';
const server = http.createServer(createApp({ credentials, store: createMemoryStore() }));
server.requestTimeout = 10_000;
server.headersTimeout = 5_000;

server.listen(port, host, () => console.log(`Abholwald DEV API listening on http://${host}:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    server.closeIdleConnections();
    setTimeout(() => process.exit(1), 5_000).unref();
  });
}
