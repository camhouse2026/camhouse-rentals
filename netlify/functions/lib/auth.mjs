// Autenticación simple del panel: contraseña en variable de entorno + token firmado (HMAC).
import { createHmac, timingSafeEqual } from "node:crypto";

const env = (k) => (globalThis.Netlify?.env?.get(k) ?? process.env[k]) || "";
const secret = () => env("ADMIN_TOKEN_SECRET") || env("ADMIN_PASSWORD") + "::camhouse";
const TTL = 1000 * 60 * 60 * 12; // 12 horas

const sign = (data) => createHmac("sha256", secret()).update(data).digest("base64url");

export function checkPassword(pw) {
  const real = env("ADMIN_PASSWORD");
  if (!real) return false;
  const a = Buffer.from(String(pw || ""));
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isAuthorized(req) {
  const h = req.headers.get("authorization") || "";
  const token = h.replace(/^Bearer\s+/i, "");
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export { env };
