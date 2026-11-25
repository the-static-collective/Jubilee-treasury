// STATIC ID 001 · Cloudflare Pages / Workers OAuth bridge.
// No TOTP secrets, Supabase service role, email redirects, or admin-token reuse.
// Routes can be mounted as a Pages catch-all: /api/static-id/{login,callback,status,logout}
// App APIs call requireStaticIdOwner(request, env) on every protected request.
import {
  identityConfig, beginAuthorization, tokenExchange, verifyJwt, ensureOwner,
  encryptJson, decryptJson, sameString, IdentityError, tokenFailureStage
} from "./oidc.mjs";

export const SESSION_COOKIE = "__Host-staticid-session";
export const FLOW_COOKIE = "__Host-staticid-flow";
const maxSessionSeconds = 3600;
function cookieValue(request, name) {
  const all = request.headers.get("Cookie") || "";
  const row = all.split(";").map(s=>s.trim()).find(s=>s.startsWith(name + "="));
  return row?.slice(name.length + 1) || "";
}
function setCookie(name, value, maxAge) {
  return name + "=" + value + "; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=" + Math.max(0,Math.floor(maxAge));
}
function noStore(extra = {}) {
  return { "Cache-Control": "private, no-store", "Referrer-Policy":"no-referrer",
    "X-Content-Type-Options":"nosniff", ...extra };
}
function json(obj,status=200) {
  return new Response(JSON.stringify(obj), {
    status, headers:noStore({ "Content-Type":"application/json; charset=utf-8" })
  });
}
function redirect(url,status=303) {
  return new Response(null,{status,headers:noStore({Location:url})});
}
function appRequest(request, config) {
  const url = new URL(request.url);
  if (url.origin !== config.origin) throw new IdentityError("Unrecognized application origin");
  return url;
}
function sameSiteMutation(request, config) {
  return request.headers.get("Origin") === config.origin;
}
export async function requireStaticIdOwner(request, env, fetcher=fetch) {
  // Session authentication is separate from per-resource authorization;
  // this module enforces ONE pinned owner only, not a multi-user roles policy.
  try {
    const config = identityConfig(env);
    appRequest(request, config);
    if (!["GET","HEAD","OPTIONS"].includes(request.method) && !sameSiteMutation(request,config)) return false;
    const seal = cookieValue(request, SESSION_COOKIE);
    if (!seal) return false;
    const session = await decryptJson(seal, config, "session");
    if (!session || typeof session.accessToken !== "string" ||
        !Number.isFinite(session.expires) || session.expires <= Date.now()) return false;
    const claims = await verifyJwt(session.accessToken, {
      issuer:config.issuer, audience:"authenticated",
      expectedClientId:config.clientId, fetcher
    });
    return sameString(claims.sub, config.ownerSub) && claims.exp * 1000 >= session.expires;
  } catch {
    return false;
  }
}
export async function handleStaticIdRequest(request, env, fetcher=fetch) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/static-id/")) return null;
  let config;
  try {
    config = identityConfig(env);
    appRequest(request, config);
  } catch { return json({ error:"Static ID is not configured" },503); }

  let failureStage = "request";
  try {
    if (url.pathname === "/api/static-id/login" && request.method === "GET") {
      const start = await beginAuthorization(config);
      const sealed = await encryptJson({
        state:start.state, nonce:start.nonce, verifier:start.verifier,
        expires:Date.now()+600_000
      },config,"flow");
      const response = redirect(start.url,302);
      response.headers.append("Set-Cookie",setCookie(FLOW_COOKIE,sealed,600));
      return response;
    }

    if (url.pathname === "/api/static-id/callback" && request.method === "GET") {
      const code = url.searchParams.get("code") || "";
      const state = url.searchParams.get("state") || "";
      failureStage = "flow_cookie_missing";
      const sealed = cookieValue(request,FLOW_COOKIE);
      if (!sealed) throw new IdentityError("OAuth flow expired");
      failureStage = "flow_cookie_invalid";
      const flow = await decryptJson(sealed,config,"flow");
      failureStage = "flow_expired_or_state_mismatch";
      if (!flow || !Number.isFinite(flow.expires) || flow.expires <= Date.now() ||
          !sameString(state,flow.state)) throw new IdentityError("OAuth state mismatch");
      failureStage = "token_exchange";
      const tokens = await tokenExchange(config,code,flow.verifier,fetcher);
      failureStage = "id_token_verification";
      const claims = await verifyJwt(tokens.id_token, {
        issuer:config.issuer,audience:config.clientId,nonce:flow.nonce,fetcher
      });
      failureStage = "owner_verification";
      ensureOwner(claims,config);
      // An ID token cannot be substituted for an access token.
      failureStage = "access_token_verification";
      const access = await verifyJwt(tokens.access_token,{
        issuer:config.issuer,audience:"authenticated",
        expectedClientId:config.clientId,fetcher
      });
      if (!sameString(access.sub,claims.sub)) throw new IdentityError("Account identity mismatch");
      const lifetime = Math.min(maxSessionSeconds,Math.floor(access.exp-Date.now()/1000));
      if (lifetime < 1) throw new IdentityError("Session already expired");
      failureStage = "session_creation";
      const session = await encryptJson({
        accessToken:tokens.access_token,
        expires:Date.now()+lifetime*1000
      },config,"session");
      const response = redirect(config.origin + "/");
      response.headers.append("Set-Cookie",setCookie(FLOW_COOKIE,"",0));
      response.headers.append("Set-Cookie",setCookie(SESSION_COOKIE,session,lifetime));
      return response;
    }

    if (url.pathname === "/api/static-id/status" && request.method === "GET") {
      return json({ authenticated:await requireStaticIdOwner(request,env,fetcher) });
    }

    if (url.pathname === "/api/static-id/logout" && request.method === "POST") {
      if (!sameSiteMutation(request,config)) return json({error:"Origin not authorized"},403);
      const response=json({ ok:true });
      response.headers.append("Set-Cookie",setCookie(SESSION_COOKIE,"",0));
      response.headers.append("Set-Cookie",setCookie(FLOW_COOKIE,"",0));
      return response;
    }

    return json({error:"Not found"},404);
  } catch (err) {
    // Never return TOTP codes, OAuth codes, JWTs, JWKS internals or upstream errors.
    const response=json({error:"Authentication failed",stage:failureStage==="token_exchange"?tokenFailureStage(err):failureStage},401);
    if (url.pathname === "/api/static-id/callback")
      response.headers.append("Set-Cookie",setCookie(FLOW_COOKIE,"",0));
    return response;
  }
}
