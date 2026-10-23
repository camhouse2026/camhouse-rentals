/* Vista de seguimiento de cotización para el cliente (y página de retorno de pago). */
(async () => {
  const { esc, money2, fmtDate, icon, api } = window.CH;
  const STATUS = {
    nueva: ["Recibida", "Recibimos su solicitud. Estamos revisando disponibilidad."],
    en_revision: ["En revisión", "Estamos confirmando disponibilidad y precios para sus fechas."],
    confirmada: ["Confirmada", "Su equipo está disponible. En breve recibirá el enlace de pago."],
    pago_pendiente: ["Pago pendiente", "Su cotización está confirmada. Complete el pago para reservar el equipo."],
    anticipo_pagado: ["Anticipo recibido", "Recibimos su anticipo. Su equipo está reservado."],
    pagada: ["Pagada", "¡Pago completo recibido! Su equipo está reservado."],
    entregada: ["Equipo entregado", "Buen rodaje. Recuerde la fecha de devolución."],
    cerrada: ["Finalizada", "Gracias por rentar con CamHouse."],
    cancelada: ["Cancelada", "Esta cotización fue cancelada. Escríbanos si necesita una nueva."],
  };
  const params = new URLSearchParams(location.search);
  const code = params.get("c"), key = params.get("k");
  const doc = document.getElementById("doc");
  const isReturn = location.pathname.includes("gracias");

  async function load() {
    const r = await fetch(`/api/quotes/${encodeURIComponent(code)}?k=${encodeURIComponent(key)}`);
    if (!r.ok) throw new Error("not found");
    return r.json();
  }

  async function mockPay() {
    const r = await fetch(`/api/quotes/${encodeURIComponent(code)}/mock-pay?k=${encodeURIComponent(key)}&ref=${encodeURIComponent(params.get("ref"))}`, { method: "POST" });
    return r.ok ? r.json() : load();
  }

  function render(q, banner = "") {
    const s = STATUS[q.status] || [q.status, ""];
    const t = q.totals;
    const pending = (q.payments || []).filter((p) => p.status === "pendiente" && p.url);
    const paid = (q.payments || []).filter((p) => p.status === "pagado");
    doc.innerHTML = `
      ${banner}
      <div class="doc-head">
        <div>
          <span class="eyebrow">Cotización</span>
          <h1 class="display" style="font-size:44px;margin:8px 0 6px">${esc(q.code)}</h1>
          <span style="color:var(--muted);font-size:14px">${esc(q.client.name)}${q.client.company ? " · " + esc(q.client.company) : ""}</span>
        </div>
        <div style="text-align:right">
          <span class="status ${esc(q.status)}">${esc(s[0])}</span>
          <p style="color:var(--muted);font-size:14px;max-width:300px;margin:10px 0 0">${esc(s[1])}</p>
        </div>
      </div>
      <div class="alert info" style="display:flex;gap:18px;flex-wrap:wrap">
        <span>${icon("calendar", 'width="14" height="14" style="vertical-align:-2px"')} <b>Retiro:</b> ${fmtDate(q.startDate)}</span>
        <span><b>Devolución:</b> ${fmtDate(q.endDate)}</span>
        <span><b>${q.days}</b> ${q.days === 1 ? "día" : "días"} de renta</span>
        ${q.client.delivery ? `<span><b>Entrega:</b> ${esc(q.client.delivery)}</span>` : ""}
      </div>
      ${q.clientMessage ? `<div class="panel" style="margin:0 0 18px"><h3>Mensaje de CamHouse</h3><p style="margin:0;white-space:pre-line">${esc(q.clientMessage)}</p></div>` : ""}
      <div style="overflow-x:auto">
      <table class="items">
        <thead><tr><th>Equipo</th><th class="num">Cant.</th><th class="num">Precio/día</th><th class="num">Total</th></tr></thead>
        <tbody>${q.items.map((i) => `<tr><td><b style="font-weight:600">${esc(i.name)}</b><br><span style="color:var(--muted);font-size:12px">${esc(i.brand)}${i.requiresTech ? " · sale con técnico CHR" : ""}</span></td><td class="num">${i.qty}</td><td class="num">${money2(i.price)}</td><td class="num">${money2(i.price * i.qty * q.days)}</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="totals">
        <div class="summary-row"><span>Equipo (${q.days} ${q.days === 1 ? "día" : "días"})</span><span>${money2(t.equipment)}</span></div>
        ${t.dayDiscount ? `<div class="summary-row" style="color:var(--ok)"><span>Descuento por días (${t.dayDiscountPercent}%)</span><span>−${money2(t.dayDiscount)}</span></div>` : ""}
        ${t.techFee ? `<div class="summary-row"><span>Técnico de CamHouse (${q.days} ${q.days === 1 ? "día" : "días"})</span><span>${money2(t.techFee)}</span></div>` : ""}
        ${t.discount ? `<div class="summary-row"><span>Descuento</span><span>−${money2(t.discount)}</span></div>` : ""}
        ${q.ivaPercent ? `<div class="summary-row"><span>IVA (${q.ivaPercent}%)</span><span>${money2(t.iva)}</span></div>` : ""}
        <div class="summary-row total"><span>Total</span><span>${money2(t.total)}</span></div>
        ${t.paid ? `<div class="summary-row" style="color:var(--ok)"><span>Pagado</span><span>${money2(t.paid)}</span></div><div class="summary-row"><b>Saldo</b><b>${money2(Math.max(0, t.balance))}</b></div>` : ""}
      </div>
      ${renderPagare(q)}
      ${pending.length && !q.signature ? `<div class="alert info" style="margin-top:18px">Para habilitar el pago, primero firme el pagaré de garantía.</div>` : ""}
      ${(q.signature ? pending : []).map((p) => `
        <div class="pay-box">
          <div><b style="font-family:var(--display);font-size:20px">${esc(p.label)}: ${money2(p.amount)}</b><p>Pago seguro con tarjeta de crédito o débito a través de Wompi.</p></div>
          <a class="btn btn-lime" href="${esc(p.url)}">Pagar con Wompi<span class="arrow">${icon("card")}</span></a>
        </div>`).join("")}
      ${paid.length ? `<div class="panel"><h3>Pagos recibidos</h3><ul class="check-list">${paid.map((p) => `<li>${esc(p.label)} — ${money2(p.amount)} · ${new Date(p.paidAt).toLocaleDateString("es-SV")}</li>`).join("")}</ul></div>` : ""}
      ${["nueva", "en_revision"].includes(q.status) ? `<p class="note" style="margin-top:22px">Los precios mostrados son un estimado. CamHouse confirmará el monto final antes de habilitar el pago.</p>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:28px">
        <p class="note" id="terms" style="max-width:520px;margin:0"></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-ghost" id="waBtn" style="display:none" target="_blank" rel="noopener">${icon("whatsapp", 'width="18" height="18"')} Enviar por WhatsApp</a>
          <button class="btn btn-ghost" id="printBtn" onclick="window.print()">Descargar PDF</button>
        </div>
      </div>`;
    api.settings().then((st) => {
      const el = document.getElementById("terms"); if (el) el.textContent = st.quoteTerms || "";
      const wa = document.getElementById("waBtn");
      if (wa) {
        const resumen = `Cotización ${q.code} — CamHouse Rentals\n${q.client.name}${q.client.company ? " · " + q.client.company : ""}\nRetiro ${fmtDate(q.startDate)} → Devolución ${fmtDate(q.endDate)} (${q.days} ${q.days === 1 ? "día" : "días"})\n` +
          q.items.map((i) => `• ${i.qty} × ${i.name}`).join("\n") + `\nTotal: ${money2(t.total)}\n${location.href}`;
        wa.href = `https://wa.me/${st.whatsapp || ""}?text=${encodeURIComponent(resumen)}`;
        wa.style.display = "";
      }
    });
    initSignature(q);
  }

  // ---- Pagaré con firma electrónica ----
  const canSign = (q) => !q.signature && !["nueva", "en_revision", "cancelada", "cerrada"].includes(q.status);
  function renderPagare(q) {
    if (q.signature) {
      const sg = q.signature;
      return `<div class="pagare" id="pagare">
        <h3>Pagaré de garantía</h3>
        <pre>${esc(sg.text || "")}</pre>
        <div class="sig-done">
          <img src="${esc(sg.image)}" alt="Firma">
          <div><b>${esc(sg.name)}</b><br><span style="font-size:13px;color:var(--muted)">Firmado electrónicamente el ${new Date(sg.signedAt).toLocaleString("es-SV", { dateStyle: "long", timeStyle: "short" })}</span><br><span class="badge ok" style="margin-top:8px">${icon("check", 'width="12" height="12"')} Pagaré firmado</span></div>
        </div>
      </div>`;
    }
    if (!canSign(q)) return "";
    return `<div class="pagare" id="pagare">
      <h3>Pagaré de garantía</h3>
      <p style="font-size:14px;color:var(--muted);margin:0 0 12px">Antes de habilitar el pago y retirar el equipo, CamHouse Rentals requiere la firma electrónica de este pagaré por el valor de reposición del equipo. Solo se hace exigible en caso de pérdida, daño o incumplimiento, según las <a href="/terminos.html" target="_blank" style="text-decoration:underline">cláusulas de renta</a>.</p>
      <pre id="pagareText">Cargando…</pre>
      <div class="form-grid">
        <div class="field full"><label for="sigName">Nombre completo del firmante *</label><input id="sigName" value="${esc(q.client.name)}"></div>
        <div class="field full"><label>Firma *</label>
          <div class="sig-pad" id="sigPad"><canvas id="sigCanvas"></canvas><span class="hint">Dibuje su firma con el dedo o el mouse</span><button type="button" class="clear" id="sigClear">Borrar</button></div>
        </div>
        <label class="full accept"><input type="checkbox" id="sigAccept"> <span>Declaro que soy la persona indicada, que he leído el pagaré y las cláusulas de renta, y que mi firma electrónica tiene el mismo valor que mi firma manuscrita.</span></label>
      </div>
      <div id="sigError" class="alert" style="display:none;margin-top:12px"></div>
      <button class="btn btn-lime" id="sigBtn" style="margin-top:14px">Firmar pagaré<span class="arrow">${icon("check")}</span></button>
    </div>`;
  }

  function initSignature(q) {
    if (!canSign(q) || !document.getElementById("sigCanvas")) return;
    api.settings().then((st) => {
      const amount = q.pagareAmount || q.totals.replacementValue;
      const fecha = new Date().toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" });
      const txt = String(st.pagareText || "").replace(/\{nombre\}/g, q.client.name).replace(/\{empresa\}/g, q.client.company ? `, en representación de ${q.client.company}` : "")
        .replace(/\{monto\}/g, `US$ ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`).replace(/\{codigo\}/g, q.code).replace(/\{fecha\}/g, fecha)
        .replace(/\{equipos\}/g, q.items.map((i) => `${i.qty} × ${i.name}`).join("; "));
      document.getElementById("pagareText").textContent = txt;
    });
    const pad = document.getElementById("sigPad"), cv = document.getElementById("sigCanvas"), ctx = cv.getContext("2d");
    const size = () => { const r = pad.getBoundingClientRect(); const d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.scale(d, d); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0a0a0a"; };
    size(); let drawing = false, drew = false;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => { drawing = true; drew = true; cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); pad.querySelector(".hint").style.display = "none"; });
    cv.addEventListener("pointermove", (e) => { if (drawing) { ctx.lineTo(...pos(e)); ctx.stroke(); } });
    cv.addEventListener("pointerup", () => { drawing = false; });
    document.getElementById("sigClear").onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); drew = false; pad.querySelector(".hint").style.display = ""; };
    document.getElementById("sigBtn").onclick = async () => {
      const err = document.getElementById("sigError"); err.style.display = "none";
      const name = document.getElementById("sigName").value.trim();
      if (!name) return show(err, "Escriba su nombre completo.");
      if (!drew) return show(err, "Dibuje su firma en el recuadro.");
      if (!document.getElementById("sigAccept").checked) return show(err, "Debe aceptar la declaración para firmar.");
      const btn = document.getElementById("sigBtn"); btn.disabled = true;
      try {
        const r = await fetch(`/api/quotes/${encodeURIComponent(code)}/sign?k=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, image: cv.toDataURL("image/png"), accept: true }) });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "No se pudo firmar");
        render(data, `<div class="alert info">${icon("check", 'width="14" height="14" style="vertical-align:-2px"')} Pagaré firmado correctamente. ${(data.payments || []).some((p) => p.status === "pendiente") ? "Ya puede realizar el pago." : "CamHouse le enviará el enlace de pago."}</div>`);
        document.getElementById("pagare")?.scrollIntoView({ behavior: "smooth" });
      } catch (e) { show(err, e.message); btn.disabled = false; }
    };
    function show(el, msg) { el.textContent = msg; el.style.display = ""; }
  }

  if (!code || !key) { doc.innerHTML = `<p>Enlace incompleto. Revise el enlace que recibió.</p>`; return; }
  try {
    if (isReturn && params.get("mock") === "1") {
      const q = await mockPay();
      render(q, `<div class="alert info"><b>Modo prueba:</b> se simuló un pago aprobado porque Wompi aún no está configurado.</div>`);
      return;
    }
    let q = await load();
    if (isReturn) {
      const banner = (ok) => ok
        ? `<div class="success" style="padding:0 0 26px"><div class="big-ico">${icon("check")}</div><h3>¡Gracias por su pago!</h3><p style="color:var(--muted)">Su pago fue procesado por Wompi. Le enviaremos la confirmación.</p></div>`
        : `<div class="alert info">Estamos confirmando su pago con Wompi. Esta página se actualizará automáticamente.</div>`;
      const isPaid = (x) => ["anticipo_pagado", "pagada"].includes(x.status);
      render(q, banner(isPaid(q)));
      for (let i = 0; i < 6 && !isPaid(q); i++) {
        await new Promise((r) => setTimeout(r, 4000));
        q = await load(); render(q, banner(isPaid(q)));
      }
    } else render(q);
  } catch {
    doc.innerHTML = `<p>No encontramos esta cotización. Verifique el enlace o escríbanos.</p>`;
  }
})();
