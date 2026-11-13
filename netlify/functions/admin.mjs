// API del panel administrativo (requiere token).
import { randomBytes } from "node:crypto";
import {
  getProducts, saveProducts, getSettings, saveSettings, getQuote, saveQuote, listQuotes,
  computeTotals, overlaps, rentalDays, imagesStore, round2, quotesStore,
} from "./lib/store.mjs";
import { checkPassword, issueToken, isAuthorized, json, env } from "./lib/auth.mjs";
import { createPaymentLink, wompiConfigured } from "./lib/wompi.mjs";
import { mailQuoteUpdate, mailConfigured } from "./lib/mail.mjs";

const STATUSES = ["nueva", "en_revision", "confirmada", "pago_pendiente", "anticipo_pagado", "pagada", "entregada", "cerrada", "cancelada"];
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const siteUrl = (req) => env("URL") && !env("NETLIFY_DEV") ? env("URL") : new URL(req.url).origin;

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/admin/, "").replace(/\/+$/, "") || "/";
  const method = req.method;

  if (path === "/login" && method === "POST") {
    const { password } = await req.json().catch(() => ({}));
    if (!env("ADMIN_PASSWORD")) return json({ error: "Falta configurar ADMIN_PASSWORD en Netlify." }, 500);
    if (!checkPassword(password)) return json({ error: "Contraseña incorrecta" }, 401);
    return json({ token: issueToken() });
  }

  if (!isAuthorized(req)) return json({ error: "No autorizado" }, 401);

  // ---------- Estado general ----------
  if (path === "/status" && method === "GET") {
    return json({ wompi: wompiConfigured(), mail: mailConfigured(), site: siteUrl(req) });
  }

  // ---------- Ajustes ----------
  if (path === "/settings") {
    if (method === "GET") return json(await getSettings());
    if (method === "PUT") {
      const b = await req.json();
      const s = {
        ivaPercent: Math.max(0, Number(b.ivaPercent) || 0),
        depositPercent: Math.min(100, Math.max(0, Number(b.depositPercent) || 0)),
        whatsapp: String(b.whatsapp || "").replace(/[^\d]/g, ""),
        email: String(b.email || "").trim(),
        address: String(b.address || "").trim(),
        quoteTerms: String(b.quoteTerms || "").trim(),
        clauses: String(b.clauses || "").trim(),
        pagareText: String(b.pagareText || "").trim(),
        techFeePerDay: Math.max(0, Number(b.techFeePerDay) || 0),
        techNote: String(b.techNote || "").trim(),
        dayDiscounts: (Array.isArray(b.dayDiscounts) ? b.dayDiscounts : [])
          .map((t) => ({ minDays: Math.max(1, Math.round(Number(t.minDays) || 0)), percent: Math.min(100, Math.max(0, Number(t.percent) || 0)) }))
          .filter((t) => t.minDays > 0 && t.percent > 0).sort((a, b) => a.minDays - b.minDays),
      };
      return json(await saveSettings(s));
    }
  }

  // ---------- Equipos ----------
  if (path === "/products" && method === "GET") return json(await getProducts());

  if (path === "/products" && method === "POST") {
    const b = await req.json();
    const list = await getProducts();
    let id = slug(b.id || `${b.brand || ""} ${b.name || "equipo"}`) || `equipo-${Date.now()}`;
    while (list.some((p) => p.id === id)) id += "-2";
    const p = normalizeProduct({ ...b, id }, list.length ? Math.min(...list.map((x) => x.order ?? 0)) - 1 : 0);
    list.push(p);
    await saveProducts(list);
    return json(p, 201);
  }

  const pm = path.match(/^\/products\/([a-z0-9-]+)$/);
  if (pm) {
    const list = await getProducts();
    const idx = list.findIndex((p) => p.id === pm[1]);
    if (idx < 0) return json({ error: "Equipo no encontrado" }, 404);
    if (method === "PUT") {
      list[idx] = normalizeProduct({ ...list[idx], ...(await req.json()), id: list[idx].id }, list[idx].order);
      await saveProducts(list);
      return json(list[idx]);
    }
    if (method === "DELETE") {
      list.splice(idx, 1);
      await saveProducts(list);
      return json({ ok: true });
    }
  }

  // ---------- Subir imagen ----------
  if (path === "/upload" && method === "POST") {
    const type = req.headers.get("content-type") || "image/jpeg";
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return json({ error: "Formato no permitido" }, 400);
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 4.5 * 1024 * 1024) return json({ error: "La imagen supera 4.5 MB" }, 400);
    const key = `${Date.now()}-${randomBytes(4).toString("hex")}.${type.split("/")[1]}`;
    await imagesStore().set(key, buf, { metadata: { type } });
    return json({ url: `/api/img/${key}` }, 201);
  }

  // ---------- Cotizaciones ----------
  if (path === "/quotes" && method === "GET") {
    const all = await listQuotes();
    return json(all.map((q) => ({
      code: q.code, status: q.status, createdAt: q.createdAt, startDate: q.startDate, endDate: q.endDate,
      days: q.days, client: { name: q.client.name, company: q.client.company }, itemsCount: q.items.reduce((s, i) => s + i.qty, 0),
      totals: computeTotals(q),
    })));
  }

  const qm = path.match(/^\/quotes\/([A-Z0-9-]+)(\/payment-link|\/manual-payment|\/send-email|\/payments\/([A-Za-z0-9-]+))?$/);
  if (qm) {
    const q = await getQuote(qm[1]);
    if (!q) return json({ error: "Cotización no encontrada" }, 404);
    const now = new Date().toISOString();

    if (!qm[2] && method === "GET") {
      const all = await listQuotes();
      return json({ ...q, totals: computeTotals(q), conflicts: overlaps(q, all), publicUrl: `${siteUrl(req)}/cotizacion.html?c=${q.code}&k=${q.key}` });
    }

    if (!qm[2] && method === "PUT") {
      const b = await req.json();
      if (b.startDate && b.endDate) { q.startDate = b.startDate; q.endDate = b.endDate; q.days = Number(b.days) || rentalDays(b.startDate, b.endDate); }
      if (Array.isArray(b.items)) {
        q.items = b.items.filter((i) => i.qty > 0).map((i) => ({
          id: String(i.id), name: String(i.name), brand: String(i.brand || ""), image: String(i.image || ""),
          price: round2(Math.max(0, Number(i.price) || 0)), qty: Math.max(1, Math.round(Number(i.qty) || 1)),
          requiresTech: Boolean(i.requiresTech), replacementValue: round2(Math.max(0, Number(i.replacementValue) || 0)),
        }));
      }
      if (b.discount !== undefined) q.discount = round2(Math.max(0, Number(b.discount) || 0));
      if (b.dayDiscountPercent !== undefined) q.dayDiscountPercent = Math.min(100, Math.max(0, Number(b.dayDiscountPercent) || 0));
      if (b.techFeePerDay !== undefined) q.techFeePerDay = round2(Math.max(0, Number(b.techFeePerDay) || 0));
      if (b.pagareAmount !== undefined) q.pagareAmount = round2(Math.max(0, Number(b.pagareAmount) || 0));
      if (b.ivaPercent !== undefined) q.ivaPercent = Math.max(0, Number(b.ivaPercent) || 0);
      if (b.internalNotes !== undefined) q.internalNotes = String(b.internalNotes);
      if (b.clientMessage !== undefined) q.clientMessage = String(b.clientMessage);
      if (b.status && STATUSES.includes(b.status) && b.status !== q.status) {
        q.history.push({ at: now, text: `Estado cambiado a "${b.status}"` });
        q.status = b.status;
        if (!["nueva", "en_revision", "cancelada"].includes(b.status)) q.formal = true;
      } else {
        q.history.push({ at: now, text: "Cotización actualizada por CamHouse" });
      }
      await saveQuote(q);
      return json({ ...q, totals: computeTotals(q) });
    }

    if (qm[2] === "/payment-link" && method === "POST") {
      const b = await req.json();
      const amount = round2(Number(b.amount));
      if (!(amount >= 1)) return json({ error: "Monto inválido (mínimo $1.00)" }, 400);
      const n = (q.payments || []).length + 1;
      const reference = `${q.code}-P${n}`;
      const label = String(b.label || (amount >= computeTotals(q).balance ? "Pago total" : "Anticipo")).slice(0, 60);
      const settings = await getSettings();
      try {
        const link = await createPaymentLink({
          reference, amount, productName: `CamHouse Rentals ${q.code} - ${label}`,
          siteUrl: siteUrl(req), quoteCode: q.code, quoteKey: q.key,
          notifyEmails: settings.email || undefined,
        });
        q.payments = q.payments || [];
        q.payments.push({ id: `P${n}`, reference, label, amount, status: "pendiente", url: link.url, idEnlace: link.idEnlace, mock: link.mock, createdAt: now });
        if (["nueva", "en_revision", "confirmada"].includes(q.status)) q.status = "pago_pendiente";
        q.history.push({ at: now, text: `Enlace de pago generado: $${amount.toFixed(2)} (${label})${link.mock ? " — modo prueba" : ""}` });
        q.formal = true;
        if (mailConfigured() && b.notify !== false) {
          const r = await mailQuoteUpdate(q, `${siteUrl(req)}/cotizacion.html?c=${q.code}&k=${q.key}`, settings, q.clientMessage || "");
          if (r.ok) q.history.push({ at: now, text: `Correo con enlace de pago enviado a ${q.client.email}` });
        }
        await saveQuote(q);
        return json({ ...q, totals: computeTotals(q) });
      } catch (e) {
        return json({ error: `No se pudo generar el enlace en Wompi. ${e.message}` }, 502);
      }
    }

    if (qm[2] === "/send-email" && method === "POST") {
      if (!mailConfigured()) return json({ error: "El envío de correos no está configurado (BREVO_API_KEY)." }, 400);
      const b = await req.json().catch(() => ({}));
      const settings = await getSettings();
      const link = `${siteUrl(req)}/cotizacion.html?c=${q.code}&k=${q.key}`;
      q.formal = true;
      const r = await mailQuoteUpdate(q, link, settings, String(b.message || q.clientMessage || ""));
      if (!r.ok) return json({ error: "No se pudo enviar el correo. Revise la clave de Brevo y el remitente verificado." }, 502);
      q.history.push({ at: now, text: `Correo enviado al cliente (${q.client.email})` });
      await saveQuote(q);
      return json({ ...q, totals: computeTotals(q) });
    }

    if (qm[2] === "/manual-payment" && method === "POST") {
      const b = await req.json();
      const amount = round2(Number(b.amount));
      if (!(amount > 0)) return json({ error: "Monto inválido" }, 400);
      const n = (q.payments || []).length + 1;
      q.payments = q.payments || [];
      q.payments.push({ id: `P${n}`, reference: `${q.code}-P${n}`, label: String(b.label || "Pago manual").slice(0, 60), amount, status: "pagado", method: String(b.method || "Transferencia"), createdAt: now, paidAt: now });
      const t = computeTotals(q);
      q.status = t.balance <= 0.009 ? "pagada" : "anticipo_pagado";
      q.history.push({ at: now, text: `Pago registrado manualmente: $${amount.toFixed(2)} (${b.method || "Transferencia"})` });
      await saveQuote(q);
      return json({ ...q, totals: computeTotals(q) });
    }

    if (qm[3] && method === "DELETE") {
      const p = (q.payments || []).find((x) => x.id === qm[3]);
      if (!p) return json({ error: "Pago no encontrado" }, 404);
      if (p.status === "pagado") return json({ error: "No se puede anular un pago recibido" }, 400);
      p.status = "anulado";
      q.history.push({ at: now, text: `Enlace de pago ${p.id} anulado` });
      await saveQuote(q);
      return json({ ...q, totals: computeTotals(q) });
    }

    if (!qm[2] && method === "DELETE") {
      await quotesStore().delete(q.code);
      return json({ ok: true });
    }
  }

  return json({ error: "Ruta no encontrada" }, 404);
};

function normalizeProduct(b, order) {
  const lines = (v) => (Array.isArray(v) ? v : String(v || "").split("\n")).map((s) => String(s).trim()).filter(Boolean);
  return {
    id: b.id,
    name: String(b.name || "Equipo sin nombre").trim(),
    brand: String(b.brand || "").trim(),
    category: String(b.category || "Grip").trim(),
    subcategory: String(b.subcategory || "").trim(),
    description: String(b.description || "").trim(),
    pricePerDay: round2(Math.max(0, Number(b.pricePerDay) || 0)),
    stock: Math.max(0, Math.round(Number(b.stock) || 0)),
    active: b.active !== false,
    featured: Boolean(b.featured),
    requiresTech: Boolean(b.requiresTech),
    replacementValue: round2(Math.max(0, Number(b.replacementValue) || 0)),
    images: lines(b.images),
    highlights: lines(b.highlights),
    included: lines(b.included),
    videoUrl: String(b.videoUrl || "").trim(),
    order: Number.isFinite(Number(b.order)) ? Number(b.order) : order,
  };
}

export const config = { path: "/api/admin/*" };
