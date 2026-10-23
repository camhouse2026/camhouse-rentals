// Integración con Wompi El Salvador (https://docs.wompi.sv)
// - Token OAuth2 client_credentials en https://id.wompi.sv/connect/token (audience wompi_api)
// - Enlaces de pago: POST https://api.wompi.sv/EnlacePago
// - Webhook: header `wompi_hash` = HMAC-SHA256(body crudo, API Secret) en hex
// Si no hay credenciales configuradas, funciona en "modo prueba" con enlaces simulados.
import { createHmac } from "node:crypto";
import { env } from "./auth.mjs";

let cached = { token: null, exp: 0 };

export const wompiConfigured = () => Boolean(env("WOMPI_CLIENT_ID") && env("WOMPI_CLIENT_SECRET"));

async function getToken() {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    audience: "wompi_api",
    client_id: env("WOMPI_CLIENT_ID"),
    client_secret: env("WOMPI_CLIENT_SECRET"),
  });
  const r = await fetch("https://id.wompi.sv/connect/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`Wompi auth ${r.status}: ${await r.text()}`);
  const data = await r.json();
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in - 120) * 1000 };
  return cached.token;
}

/**
 * Crea un enlace de pago en Wompi.
 * @returns {{ url: string, idEnlace: string|number, qr?: string, mock?: boolean }}
 */
export async function createPaymentLink({ reference, amount, productName, siteUrl, quoteCode, quoteKey, notifyEmails }) {
  const redirect = `${siteUrl}/gracias.html?c=${encodeURIComponent(quoteCode)}&k=${encodeURIComponent(quoteKey)}`;
  if (!wompiConfigured()) {
    return {
      url: `${redirect}&mock=1&ref=${encodeURIComponent(reference)}`,
      idEnlace: `MOCK-${reference}`,
      mock: true,
    };
  }
  const token = await getToken();
  const payload = {
    identificadorEnlaceComercio: reference,
    monto: Number(amount.toFixed(2)),
    nombreProducto: productName.slice(0, 100),
    formaPago: {
      permitirTarjetaCreditoDebido: true,
      permitirPagoConPuntoAgricola: false,
      permitirPagoEnCuotasAgricola: false,
    },
    configuracion: {
      urlRedirect: redirect,
      urlRetorno: `${siteUrl}/cotizacion.html?c=${encodeURIComponent(quoteCode)}&k=${encodeURIComponent(quoteKey)}`,
      urlWebhook: `${siteUrl}/api/wompi/webhook`,
      notificarTransaccionCliente: true,
      ...(notifyEmails ? { emailsNotificacion: notifyEmails } : {}),
    },
  };
  const r = await fetch("https://api.wompi.sv/EnlacePago", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Wompi EnlacePago ${r.status}: ${text}`);
  const data = JSON.parse(text);
  return { url: data.urlEnlace, idEnlace: data.idEnlace, qr: data.urlQrCodeEnlace, mock: false };
}

export function verifyWebhook(rawBody, hashHeader) {
  const secret = env("WOMPI_CLIENT_SECRET");
  if (!secret || !hashHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return expected.toLowerCase() === String(hashHeader).toLowerCase();
}

/** Consulta una transacción para doble verificación. */
export async function getTransaction(id) {
  const token = await getToken();
  const r = await fetch(`https://api.wompi.sv/TransaccionCompra/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}
