// Acceso a datos (Netlify Blobs): catálogo, cotizaciones, ajustes e imágenes.
import { getStore } from "@netlify/blobs";
import seed from "../../../data/seed-products.json" with { type: "json" };

const STRONG = { consistency: "strong" };
export const catalogStore = () => getStore({ name: "catalog", ...STRONG });
export const quotesStore = () => getStore({ name: "quotes", ...STRONG });
export const imagesStore = () => getStore({ name: "images", ...STRONG });

export const DEFAULT_SETTINGS = {
  ivaPercent: 13,
  depositPercent: 50,
  whatsapp: "",
  email: "camhouserental@gmail.com",
  address: "San Salvador, El Salvador",
  quoteTerms:
    "Precios en dólares (USD) por día de renta. La pre-cotización no reserva el equipo: CamHouse confirmará disponibilidad y precio final antes de generar el enlace de pago. Puede requerirse depósito de garantía y documento de identidad al retirar el equipo.",
  // Descuento automático por cantidad de días (se aplica el tramo mayor que alcance la renta)
  dayDiscounts: [
    { minDays: 3, percent: 10 },
    { minDays: 7, percent: 20 },
  ],
  // Cargo por día del técnico de CamHouse cuando la lista incluye equipo que debe salir con soporte técnico
  techFeePerDay: 75,
  techNote: "Este equipo sale únicamente con un técnico de CamHouse Rentals para su cuidado y operación. El cargo del técnico se agrega por día a la cotización.",
  // Cláusulas de protección (página /terminos.html y aceptación obligatoria al cotizar)
  clauses: `1. Objeto. CamHouse Rentals ("CHR") entrega en arrendamiento al cliente el equipo detallado en la cotización, por el período y precio indicados. El equipo es y seguirá siendo propiedad exclusiva de CHR.

2. Responsabilidad del cliente. Desde el momento del retiro y hasta la devolución, el cliente es responsable del equipo y responde por su pérdida, robo, hurto, daño total o parcial, cualquiera que sea la causa, incluyendo caso fortuito o fuerza mayor, por el valor de reposición a precio de mercado o de reparación, según corresponda, más los días de renta que el equipo permanezca fuera de servicio.

3. Uso. El cliente se obliga a usar el equipo conforme a las instrucciones del fabricante, por personal calificado, y a no subarrendarlo, prestarlo ni trasladarlo fuera de El Salvador sin autorización escrita de CHR.

4. Equipo con técnico. Los equipos señalados en el catálogo salen únicamente acompañados de un técnico designado por CHR, cuyo cargo se incluye en la cotización. El técnico es responsable de la operación y cuidado del equipo; el cliente debe facilitar sus condiciones de trabajo, transporte y alimentación en jornadas de rodaje.

5. Plazo y devolución. La renta se cobra por día. La devolución fuera del horario o fecha pactados genera el cobro de días adicionales a la tarifa vigente. La fecha de devolución solo puede extenderse con confirmación escrita de CHR y sujeta a disponibilidad.

6. Revisión. El equipo se entrega probado y completo según la lista de inclusiones; el cliente lo revisa al retirarlo y firma su conformidad. A la devolución, CHR revisa el equipo y notifica cualquier faltante o daño dentro de las 48 horas siguientes.

7. Pago y garantía. La reserva se confirma con el pago del anticipo indicado. CHR puede solicitar depósito de garantía, documento de identidad y referencias. El saldo debe estar cancelado antes del retiro del equipo, salvo acuerdo escrito.

8. Pagaré. Como garantía de las obligaciones derivadas de este contrato, el cliente suscribe electrónicamente un pagaré a favor de CHR por el valor de reposición del equipo arrendado, que CHR únicamente hará exigible ante incumplimiento, pérdida o daño no cubierto.

9. Cancelaciones. Cancelaciones con más de 72 horas de anticipación reciben reembolso del anticipo menos gastos administrativos; con menos de 72 horas, el anticipo no es reembolsable.

10. Jurisdicción. Para todo efecto legal, las partes se someten a las leyes de la República de El Salvador y a los tribunales de San Salvador.`,
  // Texto del pagaré; se reemplazan {nombre}, {empresa}, {monto}, {codigo}, {fecha}, {equipos}
  pagareText: `PAGARÉ SIN PROTESTO

Por este PAGARÉ, yo, {nombre}{empresa}, me obligo a pagar incondicionalmente a la orden de CAMHOUSE RENTALS, en San Salvador, El Salvador, la cantidad de {monto} DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA, correspondiente al valor de reposición del equipo arrendado según la cotización {codigo} ({equipos}), en caso de pérdida, robo, daño o incumplimiento de las condiciones de renta aceptadas.

La obligación será exigible a partir de la notificación de CamHouse Rentals del incumplimiento, pérdida o daño, y devengará interés moratorio del dos por ciento (2%) mensual sobre el saldo hasta su total cancelación. Renuncio a los beneficios de protesto, aviso, presentación y a cualquier excepción que no sea la de pago. Para efectos legales señalo como domicilio especial la ciudad de San Salvador y me someto a sus tribunales.

San Salvador, {fecha}.`,
};

export function dayDiscountFor(days, tiers) {
  const list = (tiers || []).filter((t) => Number(t.minDays) > 0 && Number(t.percent) > 0).sort((a, b) => a.minDays - b.minDays);
  let pct = 0;
  for (const t of list) if (days >= Number(t.minDays)) pct = Number(t.percent);
  return pct;
}

export async function getProducts() {
  const store = catalogStore();
  let list = await store.get("products", { type: "json" });
  if (!list) {
    list = seed;
    await store.setJSON("products", list);
  }
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveProducts(list) {
  await catalogStore().setJSON("products", list);
}

export async function getSettings() {
  const s = await catalogStore().get("settings", { type: "json" });
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}

export async function saveSettings(s) {
  const merged = { ...(await getSettings()), ...s };
  await catalogStore().setJSON("settings", merged);
  return merged;
}

export async function getQuote(code) {
  return quotesStore().get(code, { type: "json" });
}

export async function saveQuote(q) {
  q.updatedAt = new Date().toISOString();
  await quotesStore().setJSON(q.code, q);
  return q;
}

export async function listQuotes() {
  const store = quotesStore();
  const { blobs } = await store.list();
  const all = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return all.filter(Boolean).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function nextQuoteCode() {
  const store = catalogStore();
  const n = ((await store.get("quoteCounter", { type: "json" })) || 1000) + 1;
  await store.setJSON("quoteCounter", n);
  return `CH-${n}`;
}

// ---- utilidades de cálculo ----
export function rentalDays(start, end) {
  const a = new Date(start + "T00:00:00");
  const b = new Date(end + "T00:00:00");
  const d = Math.round((b - a) / 86400000);
  return Math.max(1, d);
}

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function computeTotals(q) {
  const days = q.days || 1;
  const equipment = round2(q.items.reduce((s, it) => s + it.price * it.qty * days, 0));
  const dayDiscountPercent = Number(q.dayDiscountPercent || 0);
  const dayDiscount = round2((equipment * dayDiscountPercent) / 100);
  const techFee = round2(Number(q.techFeePerDay || 0) * days);
  const subtotal = round2(equipment - dayDiscount + techFee);
  const discount = round2(Math.min(Number(q.discount || 0), subtotal));
  const base = round2(subtotal - discount);
  const iva = round2((base * Number(q.ivaPercent || 0)) / 100);
  const total = round2(base + iva);
  const paid = round2((q.payments || []).filter((p) => p.status === "pagado").reduce((s, p) => s + p.amount, 0));
  const replacementValue = round2(q.items.reduce((s, it) => s + (Number(it.replacementValue) || it.price * 30) * it.qty, 0));
  return { equipment, dayDiscountPercent, dayDiscount, techFee, subtotal, discount, base, iva, total, paid, balance: round2(total - paid), replacementValue };
}

// Unidades del mismo equipo comprometidas en otras cotizaciones confirmadas que se cruzan en fechas
export function overlaps(q, all) {
  const active = ["confirmada", "pago_pendiente", "anticipo_pagado", "pagada", "entregada"];
  const res = {};
  for (const other of all) {
    if (other.code === q.code || !active.includes(other.status)) continue;
    if (other.startDate > q.endDate || other.endDate < q.startDate) continue;
    for (const it of other.items) {
      res[it.id] = res[it.id] || { qty: 0, codes: [] };
      res[it.id].qty += it.qty;
      res[it.id].codes.push(other.code);
    }
  }
  return res;
}

export function publicQuote(q) {
  const { key, internalNotes, signature, ...rest } = q;
  return {
    ...rest,
    signature: signature ? { name: signature.name, signedAt: signature.signedAt, image: signature.image, amount: signature.amount, text: signature.text } : null,
    payments: (q.payments || []).map(({ id, label, amount, status, url, createdAt, paidAt }) => ({
      id, label, amount, status, url: status === "pendiente" ? url : undefined, createdAt, paidAt,
    })),
    totals: computeTotals(q),
  };
}
