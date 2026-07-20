/**
 * Signed session tokens — edge-safe (crypto.subtle only) so the same
 * code runs in middleware and in server actions.
 *
 * Token format: base64url(payload) + "." + base64url(hmacSha256(payload))
 * Payload: { cid: companyId | "*", role: "client" | "admin", exp: unixSeconds }
 *
 * Rotating AUTH_SECRET invalidates every session.
 */

export const SESSION_COOKIE = "awaj_report_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  cid: string; // company document id, or "*" for admin
  role: "client" | "admin";
  exp: number;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET env var");
  return s;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return new Uint8Array(sig);
}

/** Constant-time comparison. */
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createToken(
  cid: string,
  role: Session["role"]
): Promise<string> {
  const session: Session = {
    cid,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(session)));
  const sig = b64url(await hmac(payload));
  return `${payload}.${sig}`;
}

export async function verifyToken(token: string): Promise<Session | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const expected = await hmac(payload);
    if (!safeEqual(b64urlDecode(sig), expected)) return null;
    const session = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payload))
    ) as Session;
    if (typeof session.cid !== "string" || !session.exp) return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}
