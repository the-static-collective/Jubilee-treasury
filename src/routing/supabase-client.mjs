import { assert } from './envelopes.mjs';

const ALLOWED = new Set(['rpc_select_public_need', 'rpc_assert_capacity', 'rpc_public_need_hash',
  'rpc_public_capacity_hash', 'rpc_pledge_capacity', 'rpc_accept_offer',
  'rpc_consent_capacity_contact', 'rpc_capacity_contact_allowed']);

// Deployable HTTP boundary. A source's Supabase gateway verifies the access token;
// Treasury never resolves an actor ID and never substitutes a service-role credential.
// This is wired but NOT exercised against a live Supabase project by the local harness.
export function createGardenRpcClient({ sourceUrl, anonKey, accessToken, fetchImpl = globalThis.fetch }) {
  const url = new URL(sourceUrl);
  assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash &&
    typeof anonKey === 'string' && anonKey.length > 0 && typeof accessToken === 'function', 'Explicit HTTPS source and source session required');
  return async (fn, args) => {
    assert(ALLOWED.has(fn), 'Unsupported Treasury source operation');
    const token = await accessToken();
    assert(typeof token === 'string' && token.length > 0, 'HOLD: missing source-authenticated session');
    const response = await fetchImpl(new URL(`rest/v1/rpc/${fn}`, sourceUrl.endsWith('/') ? sourceUrl : sourceUrl+'/'), {
      method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args), signal: AbortSignal.timeout(10000), redirect: 'error' });
    // Avoid reflecting private source error bodies into public logs or mirror artifacts.
    assert(response.ok, `HOLD: source admission failed (${response.status})`);
    return response.json();
  };
}
