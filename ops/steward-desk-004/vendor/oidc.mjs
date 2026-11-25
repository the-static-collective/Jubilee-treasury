// STATIC ID · OAuth 2.1 PKCE / OIDC verification primitives.
// Runtime-neutral Web Crypto only. This module never handles a Proton TOTP secret.
const enc = new TextEncoder();
const dec = new TextDecoder();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const urlSafe = /^[A-Za-z0-9_-]+$/;

export class IdentityError extends Error {
  constructor(message = "Identity unavailable") {
    super(message);
    this.name = "IdentityError";
  }
}
export function b64url(bytes) {
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export function unb64url(value) {
  if (typeof value !== "string" || !urlSafe.test(value) || value.length > 16_384) {
    throw new IdentityError("Malformed encoding");
  }
  const raw = value.replace(/-/g,"+").replace(/_/g,"/");
  const padded = raw + "=".repeat((4 - raw.length % 4) % 4);
  try { return Uint8Array.from(atob(padded), c => c.charCodeAt(0)); }
  catch { throw new IdentityError("Malformed encoding"); }
}
export function randomSecret(bytes = 32) {
  const out = new Uint8Array(bytes);
  crypto.getRandomValues(out);
  return b64url(out);
}
export async function sha256Bytes(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}
export function sameString(a,b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const length = Math.max(a.length,b.length);
  let diff = a.length ^ b.length;
  for(let i=0;i<length;i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export function identityConfig(env) {
  if (!env || typeof env !== "object") throw new IdentityError();
  const issuer = String(env.STATIC_ID_ISSUER || "");
  const origin = String(env.STATIC_ID_APP_ORIGIN || "");
  const clientId = String(env.STATIC_ID_CLIENT_ID || "");
  const clientSecret = String(env.STATIC_ID_CLIENT_SECRET || "");
  const ownerSub = String(env.STATIC_ID_OWNER_SUB || "");
  const cookieKey = String(env.STATIC_ID_COOKIE_KEY || "");
  let i,o;
  try { i = new URL(issuer); o = new URL(origin); }
  catch { throw new IdentityError("Invalid identity configuration"); }
  if (i.protocol !== "https:" || o.protocol !== "https:" ||
      i.username || i.password || o.username || o.password ||
      i.pathname !== "/auth/v1" || o.pathname !== "/" ||
      i.search || i.hash || o.search || o.hash ||
      !/^[a-z0-9.-]+$/i.test(i.hostname) || !/^[a-z0-9.-]+$/i.test(o.hostname) ||
      clientId.length < 8 || clientId.length > 256 || clientSecret.length < 16 ||
      !uuid.test(ownerSub) || unb64url(cookieKey).length !== 32) {
    throw new IdentityError("Invalid identity configuration");
  }
  return { issuer: i.origin + "/auth/v1", origin: o.origin, clientId, clientSecret, ownerSub, cookieKey };
}
export async function beginAuthorization(config) {
  const state = randomSecret(), nonce = randomSecret(), verifier = randomSecret();
  const challenge = b64url(await sha256Bytes(verifier));
  const callback = config.origin + "/api/static-id/callback";
  const url = new URL(config.issuer + "/oauth/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: callback,
    scope: "openid email",
    code_challenge: challenge,
    code_challenge_method: "S256",
    nonce, state
  }).toString();
  return { url: url.toString(), state, nonce, verifier };
}
// Only fixed diagnostic classifications may cross the public callback boundary.
export class TokenExchangeError extends IdentityError {
  constructor(stage) {
    super("OAuth token exchange failed");
    this.stage=stage;
  }
}
const exchangeStages=new Set([
  "token_code_invalid","token_verifier_invalid","token_client_encoding",
  "token_request_build","token_transport","token_redirect_refused",
  "token_client_rejected","token_grant_rejected","token_http_rejected",
  "token_response_unreadable","token_response_invalid","token_response_missing_credentials"
]);
export function tokenFailureStage(error) {
  return error instanceof TokenExchangeError && exchangeStages.has(error.stage)
    ? error.stage : "token_exchange";
}
export async function tokenExchange(config, code, verifier, fetcher = fetch) {
  if (!/^[A-Za-z0-9._~-]{8,4096}$/.test(String(code)))
    throw new TokenExchangeError("token_code_invalid");
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(String(verifier)))
    throw new TokenExchangeError("token_verifier_invalid");
  // Supabase issues printable ASCII UUIDs and confidential client secrets.
  // Fail closed on pasted unicode/whitespace instead of leaking the credential.
  if (!/^[\x21-\x7e]+$/.test(config.clientId) || !/^[\x21-\x7e]+$/.test(config.clientSecret))
    throw new TokenExchangeError("token_client_encoding");
  let options;
  try {
    options = {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(config.clientId + ":" + config.clientSecret),
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      // Serialize explicitly: identical form bytes in Node and Workers.
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: config.origin + "/api/static-id/callback",
        code_verifier: verifier
      }).toString(),
      // Never follow a redirect with confidential credentials.
      redirect: "manual"
    };
  } catch { throw new TokenExchangeError("token_request_build"); }
  let response;
  try { response = await fetcher(config.issuer + "/oauth/token", options); }
  catch { throw new TokenExchangeError("token_transport"); }
  if (response.status >= 300 && response.status < 400)
    throw new TokenExchangeError("token_redirect_refused");
  if (!response.ok) {
    // Classify only standard OAuth error codes. Do not disclose upstream messages.
    let errorCode;
    try {
      const raw=await response.text();
      if (raw.length<=16384) errorCode=JSON.parse(raw)?.error;
    } catch {}
    if (response.status===401 || errorCode==="invalid_client")
      throw new TokenExchangeError("token_client_rejected");
    if (errorCode==="invalid_grant")
      throw new TokenExchangeError("token_grant_rejected");
    throw new TokenExchangeError("token_http_rejected");
  }
  let raw;
  try { raw=await response.text(); }
  catch { throw new TokenExchangeError("token_response_unreadable"); }
  if (raw.length > 16_384) throw new TokenExchangeError("token_response_invalid");
  let tokens;
  try { tokens=JSON.parse(raw); }
  catch { throw new TokenExchangeError("token_response_invalid"); }
  if (!tokens || typeof tokens.id_token !== "string" || typeof tokens.access_token !== "string")
    throw new TokenExchangeError("token_response_missing_credentials");
  return tokens;
}
function decodeJwtPart(segment) {
  const bytes = unb64url(segment);
  if (bytes.length > 8192) throw new IdentityError("Oversized JWT segment");
  try { return JSON.parse(dec.decode(bytes)); }
  catch { throw new IdentityError("Malformed JWT"); }
}
function includesAudience(aud, expected) {
  return aud === expected || (Array.isArray(aud) && aud.includes(expected));
}
export async function verifyJwt(jwt, {
  issuer, audience, nonce = undefined, expectedClientId = undefined,
  jwks = undefined, fetcher = fetch, now = Date.now()
}) {
  if (typeof jwt !== "string" || jwt.length > 16_384) throw new IdentityError("Malformed JWT");
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new IdentityError("Malformed JWT");
  const [h,p,s] = parts;
  const header = decodeJwtPart(h), claims = decodeJwtPart(p);
  if (!header || !claims || !["RS256","ES256"].includes(header.alg) ||
      typeof header.kid !== "string" || !header.kid || header.crit !== undefined ||
      !sameString(claims.iss, issuer) || !includesAudience(claims.aud, audience) ||
      typeof claims.sub !== "string" || !uuid.test(claims.sub)) {
    throw new IdentityError("Untrusted identity assertions");
  }
  const nowSecs = Math.floor(now / 1000);
  if (!Number.isFinite(claims.exp) || claims.exp <= nowSecs ||
      !Number.isFinite(claims.iat) || claims.iat > nowSecs + 60 ||
      (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > nowSecs + 60)) ||
      (nonce !== undefined && !sameString(claims.nonce, nonce)) ||
      (expectedClientId !== undefined && !sameString(claims.client_id, expectedClientId))) {
    throw new IdentityError("Untrusted identity assertions");
  }
  let keys = jwks;
  if (!keys) {
    const response = await fetcher(issuer + "/.well-known/jwks.json", {
      // Workers only implement manual and follow. Reject any redirect below.
      headers: { Accept: "application/json" }, redirect: "manual"
    });
    if (!response.ok) throw new IdentityError("Identity keys unavailable");
    const raw = await response.text();
    if (raw.length > 128_000) throw new IdentityError("Oversized key set");
    keys = JSON.parse(raw);
  }
  const jwk = Array.isArray(keys?.keys)
    ? keys.keys.find(k => k.kid === header.kid && (!k.alg || k.alg === header.alg) && k.use !== "enc")
    : null;
  if (!jwk) throw new IdentityError("Unknown signing key");
  const isEc = header.alg === "ES256";
  if (isEc ? (jwk.kty !== "EC" || jwk.crv !== "P-256") : jwk.kty !== "RSA") {
    throw new IdentityError("Unexpected signing key");
  }
  const algorithm = isEc
    ? { name:"ECDSA", namedCurve:"P-256" }
    : { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" };
  const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    isEc ? { name:"ECDSA", hash:"SHA-256" } : "RSASSA-PKCS1-v1_5",
    key, unb64url(s), enc.encode(h + "." + p)
  );
  if (!ok) throw new IdentityError("Invalid identity signature");
  return claims;
}
export function ensureOwner(claims, config) {
  if (!claims || !sameString(claims.sub,config.ownerSub) || claims.email_verified !== true) {
    throw new IdentityError("Account not authorized for this app");
  }
  return { sub: claims.sub };
}
export async function encryptJson(data, config, purpose) {
  const key = await crypto.subtle.importKey("raw",unb64url(config.cookieKey),"AES-GCM",false,["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = enc.encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({
    name:"AES-GCM",iv,additionalData:enc.encode(config.origin+"|"+purpose)
  },key,body));
  const combined = new Uint8Array(iv.length+ciphertext.length);
  combined.set(iv);combined.set(ciphertext,iv.length);
  return b64url(combined);
}
export async function decryptJson(value, config, purpose) {
  const bytes = unb64url(value);
  if (bytes.length < 29 || bytes.length > 3200) throw new IdentityError("Invalid session");
  const key = await crypto.subtle.importKey("raw",unb64url(config.cookieKey),"AES-GCM",false,["decrypt"]);
  try {
    const plain = await crypto.subtle.decrypt({
      name:"AES-GCM",iv:bytes.subarray(0,12),
      additionalData:enc.encode(config.origin+"|"+purpose)
    },key,bytes.subarray(12));
    return JSON.parse(dec.decode(plain));
  } catch {
    throw new IdentityError("Invalid session");
  }
}
