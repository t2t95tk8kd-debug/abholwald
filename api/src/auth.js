import { createHash, timingSafeEqual } from 'node:crypto';
import { SHOP_ID_PATTERN } from './service.js';

const MIN_TOKEN_LENGTH = 24;
const PLACEHOLDER_TOKEN = 'replace-with-long-random-development-token';
const digest = (value) => createHash('sha256').update(value).digest();

// Builds the credential list from the environment.
// ABHOLWALD_SHOP_TOKENS="shop_1=<token>,shop_2=<token>" binds each token to one shop.
// ABHOLWALD_DEV_TOKEN is an unbound token for local testing and may report for any shop.
export function loadCredentials(env) {
  const credentials = [];
  const add = (token, shopId) => {
    if (token === PLACEHOLDER_TOKEN) throw new Error('Replace the example token with a random value');
    if (token.length < MIN_TOKEN_LENGTH) throw new Error(`Tokens must be at least ${MIN_TOKEN_LENGTH} characters`);
    credentials.push({ digest: digest(token), shopId });
  };
  if (env.ABHOLWALD_DEV_TOKEN) add(env.ABHOLWALD_DEV_TOKEN, null);
  for (const entry of (env.ABHOLWALD_SHOP_TOKENS ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const sep = entry.indexOf('=');
    const shopId = entry.slice(0, sep);
    if (sep < 1 || !SHOP_ID_PATTERN.test(shopId)) throw new Error(`Invalid ABHOLWALD_SHOP_TOKENS entry for "${shopId}"`);
    add(entry.slice(sep + 1), shopId);
  }
  if (credentials.length === 0) throw new Error('Set ABHOLWALD_DEV_TOKEN or ABHOLWALD_SHOP_TOKENS');
  return credentials;
}

// Returns the matching credential or null. Compares fixed-length digests in constant time
// and checks every credential so timing does not reveal which one matched.
export function authenticate(header, credentials) {
  const match = /^Bearer (\S+)$/.exec(header ?? '');
  if (!match) return null;
  const candidate = digest(match[1]);
  let found = null;
  for (const credential of credentials) {
    if (timingSafeEqual(candidate, credential.digest) && !found) found = credential;
  }
  return found;
}
