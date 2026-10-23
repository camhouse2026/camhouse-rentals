// API pública: catálogo, ajustes, envío y consulta de pre-cotizaciones, imágenes subidas.
import { randomBytes, createHash } from "node:crypto";
import {
  getProducts, getSettings, getQuote, saveQuote, nextQuoteCode, rentalDays,
  computeTotals, publicQuote, imagesStore, round2, dayDiscountFor,
} from "./lib/store.mjs";
import { json } from "./lib/auth.mjs";
import { wompiConfigured } from "./lib/wompi.mjs";

const clean = (s, max = 300) => String(s ?? "").trim().slice(0, max);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");

  // --- Catálogo ---
  if (path === "/api/products" && req.method === "GET") {
    const list = (await getProducts()).filter((p) => p.active !== false);
    return json(list);
  }

  // --- Ajustes públicos ---
  if (path === "/api/settings" && req.method === "GET") {
    const s = await getSettings();
    return json({ ivaPercent: s.ivaPercent, depositPercent: s.depositPercent, whatsapp: s.whatsapp, email: s.email, address: s.address, quoteTerms: s.quoteTerms,
      dayDiscounts: s.dayDiscounts, techFeePerDay: s.techFeePerDay, techNote: s.techNote, clauses: s.clauses, pagareText: s.pagareText });
  }

  // --- Imágenes subidas desde el panel ---
  if (path.startsWith("/api/img/") && req.method === "GET") {
    const key = decodeURIComponent(path.slice("/api/img/".length));
    const res = await imagesStore().getWithMetadata(key, { type: "arrayBuffer" });
    if (!res) return new Response("No encontrado", { status: 404 });
    return new Response(res.data, {
      headers: { "content-type": res.metadata?.type || "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    });
  }

  // --- Crear pre-cotización ---
  if (path === "/api/quotes" && req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Solicitud inválida" }, 400); }
    const c = body.client || {};
    if (!clean(c.name) || !clean(c.email) || !clean(c.phone)) return json({ error: "Nombre, correo y teléfono son obligatorios." }, 400);
    if (!isDate(body.startDate) || !isDate(body.endDate) || body.endDate < body.startDate) return json({ error: "Revise las fechas de retiro y devolución." }, 400);
    const today = new Date().toISOString().slice(0, 10);
    if (body.startDate < today) return json({ error: "La fecha de retiro no puede ser en el pasado." }, 400);
    if (!body.acceptTerms) return json({ error: "Debe aceptar las cláusulas y condiciones de renta." }, 400);

    const catalog = await getProducts();
    const byId = Object.fromEntries(catalog.map((p) => [p.id, p]));
    const items = [];
    for (const it of body.items || []) {
      const p = byId[it.id];
      if (!p || p.active === false) continue;
      const qty = Math.max(1, Math.min(Number(it.qty) || 1, p.stock || 1));
      items.push({ id: p.id, name: p.name, brand: p.brand, image: p.images?.[0] || "", price: p.pricePerDay, qty, requiresTech: Boolean(p.requiresTech), replacementValue: Number(p.replacementValue) || 0 });
    }
    if (!items.length) return json({ error: "Agregue al menos un equipo a su cotización." }, 400);

    const settings = await getSettings();
    const days = rentalDays(body.startDate, body.endDate);
    const needsTech = items.some((i) => i.requiresTech);
    const q = {
      code: await nextQuoteCode(),
      key: randomBytes(9).toString("base64url"),
      status: "nueva",
      createdAt: new Date().toISOString(),
      startDate: body.startDate,
      endDate: body.endDate,
      days,
      items,
      discount: 0,
      dayDiscountPercent: dayDiscountFor(days, settings.dayDiscounts),
      techFeePerDay: needsTech ? Number(settings.techFeePerDay) || 0 : 0,
      ivaPercent: settings.ivaPercent,
      termsAcceptedAt: new Date().toISOString(),
      client: {
        name: clean(c.name, 120), company: clean(c.company, 120), email: clean(c.email, 160), phone: clean(c.phone, 40),
        projectType: clean(c.projectType, 80), delivery: clean(c.delivery, 40), notes: clean(c.notes, 1500),
      },
      payments: [],
      history: [{ at: new Date().toISOString(), text: "Pre-cotización enviada desde el sitio web" }],
    };
    q.estimate = computeTotals(q);
    await saveQuote(q);
    return json({ code: q.code, key: q.key, totals: q.estimate }, 201);
  }

  // --- Recuperar enlace: código + correo con que se cotizó ---
  if (path === "/api/quotes/find" && req.method === "POST") {
    let b; try { b = await req.json(); } catch { return json({ error: "Solicitud inválida" }, 400); }
    const code = clean(b.code, 20).toUpperCase().replace(/\s+/g, "");
    const email = clean(b.email, 160).toLowerCase();
    const q = code ? await getQuote(code) : null;
    if (!q || q.client.email.toLowerCase() !== email) return json({ error: "No encontramos una cotización con ese código y correo." }, 400);
    return json({ code: q.code, key: q.key });
  }

  // --- Consultar cotización (cliente) / pago simulado ---
  const m = path.match(/^\/api\/quotes\/([A-Z0-9-]+)(\/mock-pay|\/sign)?$/);
  if (m) {
    const q = await getQuote(m[1]);
    if (!q || q.key !== url.searchParams.get("k")) return json({ error: "Cotización no encontrada" }, 404);

    if (m[2] === "/sign" && req.method === "POST") {
      if (q.signature) return json({ error: "El pagaré ya fue firmado." }, 400);
      if (["nueva", "en_revision", "cancelada", "cerrada"].includes(q.status)) return json({ error: "El pagaré se firma cuando CamHouse confirma la cotización." }, 400);
      let b; try { b = await req.json(); } catch { return json({ error: "Solicitud inválida" }, 400); }
      const name = clean(b.name, 120);
      if (!name || !b.accept) return json({ error: "Escriba su nombre completo y acepte el pagaré." }, 400);
      if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.image || "") || b.image.length > 200000) return json({ error: "Dibuje su firma en el recuadro." }, 400);
      const settings = await getSettings();
      const t = computeTotals(q);
      const amount = round2(Number(q.pagareAmount) || t.replacementValue);
      const text = renderPagare(settings.pagareText, q, amount);
      q.signature = {
        name, image: b.image, accept: true, amount, text,
        signedAt: new Date().toISOString(),
        ip: req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "",
        userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
        clausesHash: hash(settings.clauses || ""),
      };
      q.history.push({ at: q.signature.signedAt, text: `Pagaré firmado electrónicamente por ${name} por $${amount.toFixed(2)}` });
      await saveQuote(q);
      return json(publicQuote(q));
    }

    if (m[2] === "/mock-pay" && req.method === "POST") {
      // Solo disponible mientras Wompi no esté configurado (modo prueba)
      if (wompiConfigured()) return json({ error: "No disponible" }, 403);
      const ref = url.searchParams.get("ref");
      const p = (q.payments || []).find((x) => x.reference === ref);
      if (p && p.status !== "pagado") {
        p.status = "pagado"; p.paidAt = new Date().toISOString(); p.transactionId = "SIMULADO";
        const t = computeTotals(q);
        q.status = t.balance <= 0.009 ? "pagada" : "anticipo_pagado";
        q.history.push({ at: p.paidAt, text: `Pago simulado recibido: $${round2(p.amount).toFixed(2)} (${p.label})` });
        await saveQuote(q);
      }
      return json(publicQuote(q));
    }
    if (req.method === "GET") return json(publicQuote(q));
  }

  return json({ error: "Ruta no encontrada" }, 404);
};

function hash(str) {
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

export function renderPagare(tpl, q, amount) {
  const fecha = new Date().toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" });
  const equipos = q.items.map((i) => `${i.qty} × ${i.name}`).join("; ");
  return String(tpl || "")
    .replace(/\{nombre\}/g, q.client.name)
    .replace(/\{empresa\}/g, q.client.company ? `, en representación de ${q.client.company}` : "")
    .replace(/\{monto\}/g, `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`)
    .replace(/\{codigo\}/g, q.code)
    .replace(/\{fecha\}/g, fecha)
    .replace(/\{equipos\}/g, equipos);
}

export const config = {
  path: ["/api/products", "/api/settings", "/api/quotes", "/api/quotes/*", "/api/img/*"],
};
