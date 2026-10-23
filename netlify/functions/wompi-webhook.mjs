// Webhook de Wompi: marca pagos como recibidos cuando la transacción es aprobada.
import { getQuote, saveQuote, computeTotals, round2 } from "./lib/store.mjs";
import { verifyWebhook, getTransaction } from "./lib/wompi.mjs";
import { json, env } from "./lib/auth.mjs";
import { getSettings } from "./lib/store.mjs";
import { mailPaid } from "./lib/mail.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const raw = await req.text();
  const hash = req.headers.get("wompi_hash") || req.headers.get("wompi-hash");

  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: "JSON inválido" }, 400); }

  // 1) Firma HMAC; 2) si no coincide, se consulta la transacción directamente en Wompi.
  let valid = verifyWebhook(raw, hash);
  if (!valid && data?.IdTransaccion) {
    const tx = await getTransaction(data.IdTransaccion).catch(() => null);
    valid = Boolean(tx && (tx.esAprobada === true || tx.resultadoTransaccion === "ExitosaAprobada"));
  }
  if (!valid) return json({ error: "Firma inválida" }, 401);

  const ref = data?.EnlacePago?.IdentificadorEnlaceComercio || "";
  const cut = ref.lastIndexOf("-P");
  if (cut < 0) return json({ ok: true, ignored: "referencia desconocida" });
  const code = ref.slice(0, cut);

  const q = await getQuote(code);
  if (!q) return json({ ok: true, ignored: "cotización no encontrada" });
  const p = (q.payments || []).find((x) => x.reference === ref);
  if (!p) return json({ ok: true, ignored: "pago no encontrado" });

  const approved = data.ResultadoTransaccion === "ExitosaAprobada";
  const now = new Date().toISOString();
  if (approved && p.status !== "pagado") {
    p.status = "pagado";
    p.paidAt = now;
    p.transactionId = data.IdTransaccion;
    p.authCode = data.CodigoAutorizacion;
    p.testMode = data.EsProductiva === false;
    const t = computeTotals(q);
    q.status = t.balance <= 0.009 ? "pagada" : "anticipo_pagado";
    q.history.push({ at: now, text: `Pago Wompi aprobado: $${round2(data.Monto ?? p.amount).toFixed(2)} (${p.label})${p.testMode ? " — transacción de prueba" : ""}` });
  } else if (!approved) {
    q.history.push({ at: now, text: `Intento de pago Wompi no aprobado (${data.ResultadoTransaccion || "sin resultado"})` });
  }
  await saveQuote(q);
  if (approved && p.paidAt === now) {
    const site = env("URL") || new URL(req.url).origin;
    mailPaid(q, p, `${site}/cotizacion.html?c=${encodeURIComponent(q.code)}&k=${encodeURIComponent(q.key)}`, await getSettings()).catch(() => {});
  }
  return json({ ok: true });
};

export const config = { path: "/api/wompi/webhook" };
