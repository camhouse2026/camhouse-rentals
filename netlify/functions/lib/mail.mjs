// Correos transaccionales vía Brevo (https://developers.brevo.com). Sin BREVO_API_KEY no envía nada (modo silencioso).
import { env } from "./auth.mjs";
import { computeTotals } from "./store.mjs";

const money = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fdate = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" }) : "";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const mailConfigured = () => Boolean(env("BREVO_API_KEY"));

export async function sendMail({ to, subject, html, text, replyTo, settings }) {
  if (!mailConfigured() || !to) return { skipped: true };
  const fromEmail = env("EMAIL_FROM") || settings?.email || "no-reply@camhouse.sv";
  const body = {
    sender: { name: "CamHouse Rentals", email: fromEmail },
    to: (Array.isArray(to) ? to : [to]).filter(Boolean).map((email) => ({ email })),
    subject, htmlContent: html, textContent: text || html.replace(/<[^>]+>/g, " "),
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
  };
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env("BREVO_API_KEY"), "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) console.error("Brevo", r.status, await r.text());
    return { ok: r.ok };
  } catch (e) { console.error("Brevo error", e); return { ok: false }; }
}

// ---------- plantilla base ----------
function layout(title, inner, settings) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f3f3f3;font-family:Inter,Arial,sans-serif;color:#111">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="background:#0a0a0a;color:#fff;border-radius:12px 12px 0 0;padding:20px 24px;font-weight:800;letter-spacing:.04em;font-size:18px">CAMHOUSE RENTALS</div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:24px;border:1px solid #e2e2e2;border-top:0">
      <h1 style="font-size:22px;margin:0 0 12px">${esc(title)}</h1>
      ${inner}
    </div>
    <p style="font-size:12px;color:#777;margin:16px 4px 0">${esc(settings?.address || "")}${settings?.whatsapp ? ` · WhatsApp +${esc(settings.whatsapp)}` : ""}${settings?.email ? ` · ${esc(settings.email)}` : ""}</p>
  </div></body></html>`;
}
const button = (href, label) => `<p style="margin:22px 0"><a href="${esc(href)}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px">${esc(label)}</a></p>`;
const p = (s) => `<p style="font-size:15px;line-height:1.55;margin:0 0 12px">${s}</p>`;

function quoteTable(q) {
  const t = computeTotals(q);
  const rows = q.items.map((i) => `<tr><td style="padding:8px 6px;border-bottom:1px solid #eee">${esc(i.name)}${i.requiresTech ? " <span style='font-size:11px;color:#777'>(con técnico CHR)</span>" : ""}</td><td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${i.qty} × ${money(i.price)}</td></tr>`).join("");
  const line = (l, v, strong) => `<tr><td style="padding:6px;text-align:right;color:#555">${l}</td><td style="padding:6px;text-align:right;white-space:nowrap;${strong ? "font-weight:800;font-size:16px" : ""}">${v}</td></tr>`;
  return `
    <p style="font-size:14px;color:#555;margin:0 0 10px"><b>Retiro:</b> ${fdate(q.startDate)} &nbsp;·&nbsp; <b>Devolución:</b> ${fdate(q.endDate)} &nbsp;·&nbsp; <b>${q.days}</b> ${q.days === 1 ? "día" : "días"}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
      ${line(`Equipo (${q.days} ${q.days === 1 ? "día" : "días"})`, money(t.equipment))}
      ${t.dayDiscount ? line(`Descuento por días (${t.dayDiscountPercent}%)`, "−" + money(t.dayDiscount)) : ""}
      ${t.techFee ? line("Técnico de CamHouse", money(t.techFee)) : ""}
      ${t.discount ? line("Descuento", "−" + money(t.discount)) : ""}
      ${q.ivaPercent ? line(`IVA (${q.ivaPercent}%)`, money(t.iva)) : ""}
      ${line("Total", money(t.total), true)}
      ${t.paid ? line("Pagado", money(t.paid)) + line("Saldo", money(t.balance), true) : ""}
    </table>`;
}

const STATUS_TEXT = {
  nueva: "Recibida", en_revision: "En revisión", confirmada: "Confirmada", pago_pendiente: "Confirmada — pago pendiente",
  anticipo_pagado: "Anticipo recibido", pagada: "Pagada", entregada: "Equipo entregado", cerrada: "Finalizada", cancelada: "Cancelada",
};

// ---------- correos ----------
export async function mailQuoteCreated(q, link, settings) {
  const first = q.client.name.split(" ")[0];
  await sendMail({
    to: q.client.email, settings, replyTo: settings.email,
    subject: `Recibimos su pre-cotización ${q.code} — CamHouse Rentals`,
    html: layout(`Pre-cotización ${q.code} recibida`, `
      ${p(`Hola ${esc(first)}, gracias por cotizar con CamHouse Rentals. Recibimos su solicitud y estamos revisando la disponibilidad para sus fechas. Le avisaremos por este medio cuando esté confirmada.`)}
      ${quoteTable(q)}
      ${p(`<span style="color:#777;font-size:13px">Los montos son un estimado sujeto a confirmación. No se ha realizado ningún cobro.</span>`)}
      ${button(link, "Ver mi cotización")}
      ${p(`<span style="font-size:13px;color:#555">Guarde este correo: desde el enlace podrá ver los cambios, firmar el pagaré de garantía y pagar en línea.</span>`)}`, settings),
  });
  await sendMail({
    to: settings.email, settings, replyTo: q.client.email,
    subject: `Nueva pre-cotización ${q.code} — ${q.client.name}${q.client.company ? " (" + q.client.company + ")" : ""}`,
    html: layout(`Nueva pre-cotización ${q.code}`, `
      ${p(`<b>${esc(q.client.name)}</b>${q.client.company ? " · " + esc(q.client.company) : ""}<br>${esc(q.client.email)} · ${esc(q.client.phone)}${q.client.projectType ? "<br>Proyecto: " + esc(q.client.projectType) : ""}${q.client.delivery ? "<br>Entrega: " + esc(q.client.delivery) : ""}`)}
      ${q.client.notes ? p(`<i>“${esc(q.client.notes)}”</i>`) : ""}
      ${quoteTable(q)}
      ${button(`${link.split("/cotizacion.html")[0]}/admin/#/cotizaciones/${q.code}`, "Abrir en el panel")}`, settings),
  });
}

export async function mailQuoteUpdate(q, link, settings, message) {
  const first = q.client.name.split(" ")[0];
  const pending = (q.payments || []).filter((x) => x.status === "pendiente");
  const needsSign = !q.signature && pending.length;
  await sendMail({
    to: q.client.email, settings, replyTo: settings.email,
    subject: `Cotización ${q.code}: ${STATUS_TEXT[q.status] || q.status} — CamHouse Rentals`,
    html: layout(`Cotización ${q.code} — ${STATUS_TEXT[q.status] || q.status}`, `
      ${p(`Hola ${esc(first)}, hay novedades en su cotización.`)}
      ${message ? p(`<b>Mensaje de CamHouse:</b><br>${esc(message).replace(/\n/g, "<br>")}`) : ""}
      ${quoteTable(q)}
      ${needsSign ? p(`Para habilitar el pago, primero firme el pagaré de garantía desde su enlace.`) : ""}
      ${pending.length ? p(`Pago pendiente: <b>${pending.map((x) => `${esc(x.label)} ${money(x.amount)}`).join(", ")}</b>. Puede pagar con tarjeta a través de Wompi desde su enlace.`) : ""}
      ${button(link, needsSign ? "Firmar pagaré y pagar" : pending.length ? "Ver y pagar" : "Ver mi cotización")}`, settings),
  });
}

export async function mailSigned(q, link, settings) {
  await sendMail({
    to: [q.client.email, settings.email], settings,
    subject: `Pagaré firmado — cotización ${q.code}`,
    html: layout(`Pagaré de garantía firmado`, `
      ${p(`Copia del pagaré firmado electrónicamente por <b>${esc(q.signature.name)}</b> el ${new Date(q.signature.signedAt).toLocaleString("es-SV", { dateStyle: "long", timeStyle: "short" })}.`)}
      <pre style="white-space:pre-wrap;font:14px/1.6 Inter,Arial,sans-serif;background:#f6f6f6;padding:16px;border-radius:10px">${esc(q.signature.text)}</pre>
      <p><img src="${esc(q.signature.image)}" alt="Firma" style="max-width:240px;border-bottom:1px solid #111"></p>
      ${button(link, "Ver mi cotización")}`, settings),
  });
}

export async function mailPaid(q, payment, link, settings) {
  const t = computeTotals(q);
  await sendMail({
    to: [q.client.email, settings.email], settings,
    subject: `Pago recibido ${money(payment.amount)} — cotización ${q.code}`,
    html: layout(`Pago recibido`, `
      ${p(`Recibimos su pago de <b>${money(payment.amount)}</b> (${esc(payment.label)}) para la cotización ${q.code}.${payment.transactionId && payment.transactionId !== "SIMULADO" ? ` Transacción Wompi: ${esc(payment.transactionId)}.` : ""}`)}
      ${quoteTable(q)}
      ${t.balance > 0 ? p(`Saldo pendiente: <b>${money(t.balance)}</b>.`) : p(`Su equipo queda reservado para el ${fdate(q.startDate)}.`)}
      ${button(link, "Ver mi cotización")}`, settings),
  });
}

export async function mailFind(email, quotes, siteUrl, settings) {
  await sendMail({
    to: email, settings, replyTo: settings.email,
    subject: `Sus cotizaciones en CamHouse Rentals`,
    html: layout(`Sus cotizaciones`, `
      ${p(`Estas son las cotizaciones asociadas a su correo. Abra la que necesite para ver su estado, firmar el pagaré o pagar.`)}
      <ul style="padding-left:18px;font-size:15px;line-height:1.8">${quotes.map((q) => `<li><a href="${esc(`${siteUrl}/cotizacion.html?c=${q.code}&k=${q.key}`)}" style="color:#111;font-weight:700">${esc(q.code)}</a> — ${STATUS_TEXT[q.status] || q.status} · ${fdate(q.startDate)} · ${money(computeTotals(q).total)}</li>`).join("")}</ul>`, settings),
  });
}
