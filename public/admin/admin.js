/* Panel administrativo de CamHouse Rentals */
(() => {
  // ---------- utilidades ----------
  const P = {
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    camera: '<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
  };
  const icon = (n, a = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${a}>${P[n]}</svg>`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const m2 = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const fd = (iso) => iso ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" }) : "";
  const fdt = (iso) => iso ? new Date(iso).toLocaleString("es-SV", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000));
  const root = document.getElementById("admin");
  const STATUS = {
    nueva: "Nueva", en_revision: "En revisión", confirmada: "Confirmada", pago_pendiente: "Pago pendiente",
    anticipo_pagado: "Anticipo pagado", pagada: "Pagada", entregada: "Entregada", cerrada: "Cerrada", cancelada: "Cancelada",
  };
  const CATS = ["Cámaras", "Ópticas", "Iluminación", "Gripería", "Kits"];

  let token = ""; try { token = sessionStorage.getItem("ch_admin") || ""; } catch {}
  let status = { wompi: false }, settings = {}, products = [];

  function toast(msg) {
    const t = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3000);
  }

  async function api(path, opts = {}) {
    const r = await fetch("/api/admin" + path, {
      ...opts,
      headers: { ...(opts.body && !(opts.body instanceof Blob) ? { "content-type": "application/json" } : {}), ...(opts.headers || {}), authorization: `Bearer ${token}` },
      body: opts.body && !(opts.body instanceof Blob) && typeof opts.body !== "string" ? JSON.stringify(opts.body) : opts.body,
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== "/login") { logout(); throw new Error("Sesión expirada"); }
    if (!r.ok) throw new Error(data.error || "Error del servidor");
    return data;
  }

  function logout() { token = ""; try { sessionStorage.removeItem("ch_admin"); } catch {} renderLogin(); }

  // ---------- Login ----------
  function renderLogin(err = "") {
    root.innerHTML = `
      <div class="login-wrap"><form class="login-card" id="loginForm">
        <a class="logo lg"><img src="/img/logo-black.png" alt="Camhouse"></a>
        <h1>Panel</h1><p>Ingrese la contraseña de administración.</p>
        ${err ? `<div class="alert">${esc(err)}</div>` : ""}
        <div class="field"><label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password" required autofocus></div>
        <button class="btn btn-lime btn-block" style="margin-top:16px">Entrar<span class="arrow">${icon("arrow")}</span></button>
      </form></div>`;
    document.getElementById("loginForm").onsubmit = async (e) => {
      e.preventDefault();
      try {
        const { token: t } = await api("/login", { method: "POST", body: { password: document.getElementById("pw").value } });
        token = t; try { sessionStorage.setItem("ch_admin", t); } catch {}
        boot();
      } catch (er) { renderLogin(er.message); }
    };
  }

  // ---------- Shell ----------
  function shell(active, content) {
    root.innerHTML = `
      <div class="mobile-top"><a class="logo"><img src="/img/logo-white.png" alt="Camhouse"></a><button id="menuBtn" aria-label="Menú">${icon("menu", 'width="24" height="24"')}</button></div>
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          <a class="logo" href="#/cotizaciones" style="flex-direction:column;align-items:flex-start;gap:6px"><img src="/img/logo-white.png" alt="Camhouse"><small style="font-size:9px;letter-spacing:.32em;color:#8d8d8d;font-weight:600">PANEL</small></a>
          <a class="nav-item ${active === "q" ? "active" : ""}" href="#/cotizaciones">${icon("list")} Cotizaciones <span class="pill" id="newCount" style="display:none"></span></a>
          <a class="nav-item ${active === "p" ? "active" : ""}" href="#/equipos">${icon("camera")} Equipos</a>
          <a class="nav-item ${active === "s" ? "active" : ""}" href="#/ajustes">${icon("gear")} Ajustes</a>
          <a class="nav-item" href="/" target="_blank">${icon("ext")} Ver sitio</a>
          <div class="spacer"></div>
          <div class="mode ${status.wompi ? "ok" : "warn"}"><b>${status.wompi ? "Wompi conectado" : "Wompi en modo prueba"}</b>${status.wompi ? "Los enlaces de pago son reales." : "Configure WOMPI_CLIENT_ID y WOMPI_CLIENT_SECRET en Netlify."}</div>
          <a class="nav-item" href="#" id="logoutBtn">${icon("out")} Salir</a>
        </aside>
        <main class="main" id="main">${content}</main>
      </div>`;
    document.getElementById("logoutBtn").onclick = (e) => { e.preventDefault(); logout(); };
    document.getElementById("menuBtn").onclick = () => document.getElementById("sidebar").classList.toggle("open");
  }

  // ---------- Cotizaciones ----------
  let qFilter = { q: "", status: "" };
  async function viewQuotes() {
    shell("q", `<p class="muted">Cargando…</p>`);
    const list = await api("/quotes");
    const nuevas = list.filter((q) => q.status === "nueva").length;
    const nc = document.getElementById("newCount"); if (nuevas) { nc.textContent = nuevas; nc.style.display = ""; }
    const draw = () => {
      const w = qFilter.q.toLowerCase();
      const rows = list.filter((q) => (!qFilter.status || q.status === qFilter.status) && (!w || `${q.code} ${q.client.name} ${q.client.company}`.toLowerCase().includes(w)));
      document.getElementById("main").innerHTML = `
        <div class="page-head"><div><h1>Cotizaciones</h1><p>${list.length} en total · ${nuevas} nuevas por revisar</p></div></div>
        <div class="filters">
          <label class="search">${icon("search")}<input id="qs" placeholder="Buscar por código, cliente o empresa" value="${esc(qFilter.q)}"></label>
        </div>
        <div class="tabs">${[["", "Todas"], ...Object.entries(STATUS)].map(([k, v]) => `<button class="chip ${qFilter.status === k ? "active" : ""}" data-st="${k}">${v} <span>${k ? list.filter((q) => q.status === k).length : list.length}</span></button>`).join("")}</div>
        <div class="box" style="padding:6px 10px;overflow-x:auto">
          ${rows.length ? `<table class="tbl"><thead><tr><th>Código</th><th>Cliente</th><th class="hide-sm">Fechas</th><th class="hide-sm">Equipos</th><th>Estado</th><th class="num">Total</th><th class="num hide-sm">Pagado</th></tr></thead><tbody>
            ${rows.map((q) => `<tr class="click" data-go="#/cotizaciones/${q.code}">
              <td><b>${esc(q.code)}</b><br><span class="muted" style="font-size:12px">${fdt(q.createdAt)}</span></td>
              <td>${esc(q.client.name)}<br><span class="muted" style="font-size:12px">${esc(q.client.company || "")}</span></td>
              <td class="hide-sm">${fd(q.startDate)} → ${fd(q.endDate)}<br><span class="muted" style="font-size:12px">${q.days} días</span></td>
              <td class="hide-sm">${q.itemsCount}</td>
              <td><span class="status ${q.status}">${STATUS[q.status] || q.status}</span></td>
              <td class="num"><b>${m2(q.totals.total)}</b></td>
              <td class="num hide-sm">${q.totals.paid ? m2(q.totals.paid) : "—"}</td></tr>`).join("")}
          </tbody></table>` : `<div class="empty" style="margin:10px 0">No hay cotizaciones ${qFilter.status || qFilter.q ? "con ese filtro" : "todavía"}.</div>`}
        </div>`;
      const qs = document.getElementById("qs");
      qs.oninput = () => { qFilter.q = qs.value; draw(); const el = document.getElementById("qs"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    };
    draw();
    document.getElementById("main").onclick = (e) => {
      const st = e.target.closest("[data-st]"); if (st) { qFilter.status = st.dataset.st; draw(); return; }
      const tr = e.target.closest("[data-go]"); if (tr) location.hash = tr.dataset.go;
    };
  }

  async function viewQuote(code) {
    shell("q", `<p class="muted">Cargando…</p>`);
    if (!products.length) products = await api("/products");
    let q = await api(`/quotes/${code}`);
    let draft = JSON.parse(JSON.stringify({ items: q.items, startDate: q.startDate, endDate: q.endDate, days: q.days, discount: q.discount || 0, dayDiscountPercent: q.dayDiscountPercent || 0, techFeePerDay: q.techFeePerDay || 0, pagareAmount: q.pagareAmount || 0, ivaPercent: q.ivaPercent ?? settings.ivaPercent, status: q.status, internalNotes: q.internalNotes || "", clientMessage: q.clientMessage || "" }));
    let dirty = false;

    const calc = () => {
      const equipment = r2(draft.items.reduce((s, i) => s + i.price * i.qty * draft.days, 0));
      const dayDiscount = r2(equipment * (Number(draft.dayDiscountPercent) || 0) / 100);
      const techFee = r2((Number(draft.techFeePerDay) || 0) * draft.days);
      const subtotal = r2(equipment - dayDiscount + techFee);
      const discount = r2(Math.min(draft.discount || 0, subtotal));
      const base = r2(subtotal - discount);
      const iva = r2(base * (Number(draft.ivaPercent) || 0) / 100);
      const total = r2(base + iva);
      const paid = r2((q.payments || []).filter((p) => p.status === "pagado").reduce((s, p) => s + p.amount, 0));
      const replacementValue = r2(draft.items.reduce((s, i) => s + (Number(i.replacementValue) || i.price * 30) * i.qty, 0));
      return { equipment, dayDiscount, techFee, subtotal, discount, iva, total, paid, balance: r2(total - paid), replacementValue };
    };
    const phoneIntl = (p) => { const d = String(p || "").replace(/\D/g, ""); return d.length === 8 ? "503" + d : d; };
    const shareText = (p) => `Hola ${q.client.name.split(" ")[0]}, le saluda CamHouse Rentals. Su cotización ${q.code} (${fd(q.startDate)} al ${fd(q.endDate)}) está confirmada. Puede realizar el pago de ${m2(p.amount)} (${p.label}) aquí: ${p.url}\n\nDetalle de su cotización: ${q.publicUrl}`;

    const draw = () => {
      const t = calc();
      const conf = q.conflicts || {};
      const prodOpts = products.filter((p) => !draft.items.some((i) => i.id === p.id)).map((p) => `<option value="${esc(p.id)}">${esc(p.name)} — ${m2(p.pricePerDay)}</option>`).join("");
      const deposit = r2(t.total * (Number(settings.depositPercent) || 50) / 100);
      document.getElementById("main").innerHTML = `
        <div class="page-head">
          <div><a href="#/cotizaciones" class="link-btn">${icon("back", 'width="14" height="14" style="vertical-align:-2px"')} Cotizaciones</a>
            <h1 style="margin-top:6px">${esc(q.code)} <span class="status ${q.status}" style="vertical-align:middle;font-size:11px">${STATUS[q.status]}</span></h1>
            <p>Recibida ${fdt(q.createdAt)}</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn btn-ghost sm" href="${esc(q.publicUrl)}" target="_blank">Vista del cliente ${icon("ext", 'width="14" height="14"')}</a>
            <button class="btn btn-dark sm" id="saveBtn" ${dirty ? "" : "disabled"}>Guardar cambios<span class="arrow">${icon("arrow")}</span></button>
          </div>
        </div>
        <div class="detail">
          <div>
            <div class="box">
              <h2>Equipo y fechas</h2>
              <div class="form-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
                <div class="field"><label>Retiro</label><input type="date" id="dS" value="${draft.startDate}"></div>
                <div class="field"><label>Devolución</label><input type="date" id="dE" value="${draft.endDate}"></div>
                <div class="field"><label>Días cobrados</label><input type="number" min="1" id="dD" value="${draft.days}"></div>
              </div>
              <div style="overflow-x:auto"><table class="tbl">
                <thead><tr><th></th><th>Equipo</th><th class="num">Cant.</th><th class="num">$/día</th><th class="num">Total</th><th></th></tr></thead>
                <tbody>${draft.items.map((i, idx) => {
                  const p = products.find((x) => x.id === i.id);
                  const used = conf[i.id]?.qty || 0;
                  const over = p && used + i.qty > p.stock;
                  return `<tr>
                    <td><img class="thumb" src="${esc(i.image)}" alt=""></td>
                    <td><b style="font-weight:600">${esc(i.name)}</b><br><span class="muted" style="font-size:12px">Stock: ${p ? p.stock : "?"}${used ? ` · ${used} comprometidas (${conf[i.id].codes.join(", ")})` : ""}</span>
                      ${over ? `<br><span class="warn-chip">Posible conflicto de disponibilidad</span>` : ""}</td>
                    <td class="num"><input class="qty-in" type="number" min="1" data-i="${idx}" data-f="qty" value="${i.qty}"></td>
                    <td class="num"><input type="number" min="0" step="0.01" data-i="${idx}" data-f="price" value="${i.price}"></td>
                    <td class="num">${m2(i.price * i.qty * draft.days)}</td>
                    <td><button class="link-btn danger" data-rm="${idx}">Quitar</button></td></tr>`;
                }).join("")}</tbody></table></div>
              <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
                <select class="select" id="addSel" style="flex:1;height:44px;min-width:200px"><option value="">+ Agregar equipo…</option>${prodOpts}</select>
              </div>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px;max-width:420px;margin-left:auto">
                <div class="field"><label>Desc. por días (%)</label><input type="number" min="0" max="100" step="0.5" id="dayDisc" value="${draft.dayDiscountPercent}"></div>
                <div class="field"><label>Técnico CHR ($/día)</label><input type="number" min="0" step="0.01" id="techFee" value="${draft.techFeePerDay}"></div>
                <div class="field"><label>Descuento extra ($)</label><input type="number" min="0" step="0.01" id="disc" value="${draft.discount}"></div>
                <div class="field"><label>IVA (%)</label><input type="number" min="0" step="0.01" id="iva" value="${draft.ivaPercent}"></div>
              </div>
              ${draft.items.some((i) => i.requiresTech) && !Number(draft.techFeePerDay) ? `<p class="muted" style="font-size:12px;text-align:right;margin:6px 0 0">Hay equipo que sale con técnico y el cargo está en $0.</p>` : ""}
              <div class="totals" style="width:min(360px,100%)">
                <div class="summary-row"><span>Equipo (${draft.days} días)</span><span>${m2(t.equipment)}</span></div>
                ${t.dayDiscount ? `<div class="summary-row" style="color:var(--ok)"><span>Descuento por días</span><span>−${m2(t.dayDiscount)}</span></div>` : ""}
                ${t.techFee ? `<div class="summary-row"><span>Técnico CHR</span><span>${m2(t.techFee)}</span></div>` : ""}
                <div class="summary-row"><span>Subtotal</span><span>${m2(t.subtotal)}</span></div>
                ${t.discount ? `<div class="summary-row"><span>Descuento</span><span>−${m2(t.discount)}</span></div>` : ""}
                <div class="summary-row"><span>IVA</span><span>${m2(t.iva)}</span></div>
                <div class="summary-row total"><span>Total</span><span>${m2(t.total)}</span></div>
                <div class="summary-row" style="color:var(--ok)"><span>Pagado</span><span>${m2(t.paid)}</span></div>
                <div class="summary-row"><b>Saldo</b><b>${m2(t.balance)}</b></div>
              </div>
            </div>
            <div class="box">
              <h2>Mensajes</h2>
              <div class="stack">
                <div class="field"><label>Mensaje visible para el cliente</label><textarea id="cMsg" placeholder="Ej.: Confirmamos disponibilidad. El retiro es a partir de las 8:00 a. m.">${esc(draft.clientMessage)}</textarea></div>
                <div class="field"><label>Notas internas (solo CamHouse)</label><textarea id="iNotes">${esc(draft.internalNotes)}</textarea></div>
              </div>
            </div>
            <div class="box"><h2>Historial</h2><ul class="timeline">${[...(q.history || [])].reverse().map((h) => `<li><b style="color:var(--ink)">${fdt(h.at)}</b> — ${esc(h.text)}</li>`).join("")}</ul></div>
          </div>

          <div>
            <div class="box">
              <h2>Cliente</h2>
              <dl class="kv">
                <dt>Nombre</dt><dd>${esc(q.client.name)}</dd>
                ${q.client.company ? `<dt>Empresa</dt><dd>${esc(q.client.company)}</dd>` : ""}
                <dt>Correo</dt><dd><a class="link-btn" href="mailto:${esc(q.client.email)}">${esc(q.client.email)}</a></dd>
                <dt>Teléfono</dt><dd><a class="link-btn" href="https://wa.me/${phoneIntl(q.client.phone)}" target="_blank">${esc(q.client.phone)}</a></dd>
                ${q.client.projectType ? `<dt>Proyecto</dt><dd>${esc(q.client.projectType)}</dd>` : ""}
                ${q.client.delivery ? `<dt>Entrega</dt><dd>${esc(q.client.delivery)}</dd>` : ""}
                ${q.client.notes ? `<dt>Comentarios</dt><dd style="white-space:pre-line">${esc(q.client.notes)}</dd>` : ""}
                <dt>Cláusulas</dt><dd>${q.termsAcceptedAt ? `Aceptadas ${fdt(q.termsAcceptedAt)}` : "<span class='muted'>Sin registro</span>"}</dd>
              </dl>
            </div>
            <div class="box">
              <h2>Pagaré ${q.signature ? `<span class="mini pagado">Firmado</span>` : `<span class="mini pendiente">Sin firmar</span>`}</h2>
              ${q.signature ? `
                <div style="display:flex;gap:12px;align-items:center"><img src="${esc(q.signature.image)}" alt="Firma" style="width:120px;border-bottom:1px solid var(--ink)"><div style="font-size:13px"><b>${esc(q.signature.name)}</b><br><span class="muted">${fdt(q.signature.signedAt)} · ${m2(q.signature.amount)}</span><br><span class="muted" style="font-size:11px">IP ${esc(q.signature.ip || "—")}</span></div></div>
                <a class="link-btn" style="display:inline-block;margin-top:10px" href="${esc(q.publicUrl)}#pagare" target="_blank">Ver / imprimir pagaré</a>`
              : `<div class="field"><label>Monto del pagaré ($)</label><input type="number" min="0" step="0.01" id="pagareAmt" value="${draft.pagareAmount || ""}" placeholder="${t.replacementValue}"></div>
                 <p class="muted" style="font-size:12px;margin:8px 0 0">Vacío = valor de reposición estimado (${m2(t.replacementValue)}). El cliente firma desde su enlace una vez confirmada la cotización; el pago se habilita después de la firma.</p>`}
            </div>
            <div class="box">
              <h2>Estado</h2>
              <select class="select" id="stSel" style="width:100%;height:44px;border-radius:12px">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${draft.status === k ? "selected" : ""}>${v}</option>`).join("")}</select>
            </div>
            <div class="box">
              <h2>Pagos ${status.wompi ? "" : `<span class="mini pendiente">Modo prueba</span>`}</h2>
              ${dirty ? `<div class="alert info" style="font-size:12px">Guarde los cambios antes de generar un enlace de pago.</div>` : ""}
              <div class="quick">
                ${t.paid === 0 ? `<button data-amt="${deposit}">Anticipo ${settings.depositPercent || 50}% (${m2(deposit)})</button>` : ""}
                <button data-amt="${Math.max(0, t.balance)}">${t.paid ? "Saldo" : "Total"} (${m2(Math.max(0, t.balance))})</button>
              </div>
              <div class="amount-row"><input id="amt" type="number" min="1" step="0.01" placeholder="Monto $" value="${Math.max(0, t.balance) || ""}"><input id="lbl" placeholder="Concepto" value="${t.paid ? "Saldo" : "Pago total"}"></div>
              <button class="btn btn-lime btn-block sm" id="linkBtn" ${dirty || t.balance <= 0 ? "disabled" : ""}>Generar enlace Wompi<span class="arrow">${icon("card")}</span></button>
              <button class="link-btn" id="manualBtn" style="margin:12px 0 4px">Registrar pago manual (efectivo / transferencia)</button>
              <div style="margin-top:14px">${(q.payments || []).slice().reverse().map((p) => `
                <div class="pay-item">
                  <div class="row"><b>${esc(p.label)} · ${m2(p.amount)}</b><span class="mini ${p.status}">${p.status}</span></div>
                  <div class="muted" style="margin-top:4px">${p.id} · ${fdt(p.createdAt)}${p.paidAt ? ` · pagado ${fdt(p.paidAt)}` : ""}${p.method ? ` · ${esc(p.method)}` : ""}${p.mock ? " · simulado" : ""}${p.transactionId && p.transactionId !== "SIMULADO" ? `<br>Transacción: ${esc(p.transactionId)}` : ""}</div>
                  ${p.status === "pendiente" && p.url ? `
                    <div class="url"><input readonly value="${esc(p.url)}"><button class="btn btn-dark sm" style="height:34px;padding:0 10px" data-copy="${esc(p.url)}">Copiar</button></div>
                    <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
                      <a class="link-btn" target="_blank" href="https://wa.me/${phoneIntl(q.client.phone)}?text=${encodeURIComponent(shareText(p))}">Enviar por WhatsApp</a>
                      <a class="link-btn" href="mailto:${esc(q.client.email)}?subject=${encodeURIComponent(`CamHouse Rentals — Pago cotización ${q.code}`)}&body=${encodeURIComponent(shareText(p))}">Enviar por correo</a>
                      <button class="link-btn danger" data-void="${p.id}">Anular</button>
                    </div>` : ""}
                </div>`).join("") || `<p class="muted" style="font-size:13px">Aún no hay pagos.</p>`}</div>
            </div>
            <div class="box"><button class="link-btn danger" id="delBtn">Eliminar cotización</button></div>
          </div>
        </div>`;
    };
    draw();

    const main = document.getElementById("main");
    const mark = () => { dirty = true; const b = document.getElementById("saveBtn"); b.disabled = false; };
    main.oninput = (e) => {
      const el = e.target;
      if (el.dataset.f) { draft.items[el.dataset.i][el.dataset.f] = Math.max(el.dataset.f === "qty" ? 1 : 0, Number(el.value) || 0); mark(); return; }
      if (el.id === "disc") { draft.discount = Number(el.value) || 0; mark(); }
      if (el.id === "dayDisc") { draft.dayDiscountPercent = Number(el.value) || 0; mark(); }
      if (el.id === "techFee") { draft.techFeePerDay = Number(el.value) || 0; mark(); }
      if (el.id === "pagareAmt") { draft.pagareAmount = Number(el.value) || 0; mark(); }
      if (el.id === "iva") { draft.ivaPercent = Number(el.value) || 0; mark(); }
      if (el.id === "cMsg") { draft.clientMessage = el.value; mark(); }
      if (el.id === "iNotes") { draft.internalNotes = el.value; mark(); }
    };
    main.onchange = (e) => {
      const el = e.target;
      if (el.dataset.f || ["disc", "iva", "dD", "dayDisc", "techFee"].includes(el.id)) { if (el.id === "dD") draft.days = Math.max(1, Number(el.value) || 1); dirty = true; draw(); }
      if (el.id === "dS" || el.id === "dE") {
        draft.startDate = document.getElementById("dS").value; draft.endDate = document.getElementById("dE").value;
        if (draft.endDate < draft.startDate) draft.endDate = draft.startDate;
        draft.days = daysBetween(draft.startDate, draft.endDate); dirty = true; draw();
      }
      if (el.id === "stSel") { draft.status = el.value; dirty = true; draw(); }
      if (el.id === "addSel" && el.value) {
        const p = products.find((x) => x.id === el.value);
        draft.items.push({ id: p.id, name: p.name, brand: p.brand, image: p.images[0] || "", price: p.pricePerDay, qty: 1, requiresTech: Boolean(p.requiresTech), replacementValue: Number(p.replacementValue) || 0 });
        if (p.requiresTech && !Number(draft.techFeePerDay)) draft.techFeePerDay = Number(settings.techFeePerDay) || 0;
        dirty = true; draw();
      }
    };
    main.onclick = async (e) => {
      const t = e.target;
      try {
        if (t.closest("[data-rm]")) { draft.items.splice(Number(t.closest("[data-rm]").dataset.rm), 1); dirty = true; draw(); }
        else if (t.closest("[data-amt]")) {
          const b = t.closest("[data-amt]"); document.getElementById("amt").value = b.dataset.amt;
          document.getElementById("lbl").value = b.textContent.startsWith("Anticipo") ? "Anticipo" : (calc().paid ? "Saldo" : "Pago total");
        }
        else if (t.closest("#saveBtn")) {
          if (!draft.items.length) return toast("La cotización necesita al menos un equipo");
          q = { ...(await api(`/quotes/${code}`, { method: "PUT", body: draft })), publicUrl: q.publicUrl, conflicts: q.conflicts };
          dirty = false; draw(); toast("Cambios guardados");
        }
        else if (t.closest("#linkBtn")) {
          const amount = Number(document.getElementById("amt").value);
          const label = document.getElementById("lbl").value || "Pago";
          if (!(amount >= 1)) return toast("Ingrese un monto válido");
          if (amount > calc().balance + 0.001 && !confirm("El monto supera el saldo pendiente. ¿Continuar?")) return;
          t.closest("#linkBtn").disabled = true;
          q = { ...(await api(`/quotes/${code}/payment-link`, { method: "POST", body: { amount, label } })), publicUrl: q.publicUrl, conflicts: q.conflicts };
          draft.status = q.status; draw(); toast("Enlace de pago generado");
        }
        else if (t.closest("#manualBtn")) {
          const amount = prompt("Monto recibido (USD):", calc().balance);
          if (!amount) return;
          const method = prompt("Método (efectivo, transferencia, etc.):", "Transferencia") || "Transferencia";
          q = { ...(await api(`/quotes/${code}/manual-payment`, { method: "POST", body: { amount: Number(amount), method, label: "Pago manual" } })), publicUrl: q.publicUrl, conflicts: q.conflicts };
          draft.status = q.status; draw(); toast("Pago registrado");
        }
        else if (t.closest("[data-void]")) {
          if (!confirm("¿Anular este enlace? El cliente ya no lo verá en su cotización.")) return;
          q = { ...(await api(`/quotes/${code}/payments/${t.closest("[data-void]").dataset.void}`, { method: "DELETE" })), publicUrl: q.publicUrl, conflicts: q.conflicts };
          draw(); toast("Enlace anulado");
        }
        else if (t.closest("[data-copy]")) { await navigator.clipboard.writeText(t.closest("[data-copy]").dataset.copy); toast("Enlace copiado"); }
        else if (t.closest("#delBtn")) {
          if (!confirm(`¿Eliminar definitivamente la cotización ${code}?`)) return;
          await api(`/quotes/${code}`, { method: "DELETE" }); location.hash = "#/cotizaciones"; toast("Cotización eliminada");
        }
      } catch (er) { toast(er.message); draw(); }
    };
  }

  // ---------- Equipos ----------
  let pFilter = { q: "", cat: "" };
  async function viewProducts() {
    shell("p", `<p class="muted">Cargando…</p>`);
    products = await api("/products");
    const draw = () => {
      const w = pFilter.q.toLowerCase();
      const rows = products.filter((p) => (!pFilter.cat || p.category === pFilter.cat) && (!w || `${p.name} ${p.brand}`.toLowerCase().includes(w)));
      document.getElementById("main").innerHTML = `
        <div class="page-head"><div><h1>Equipos</h1><p>${products.length} equipos · ${products.filter((p) => p.active !== false).length} visibles en el sitio</p></div>
          <a class="btn btn-lime sm" href="#/equipos/nuevo">Nuevo equipo<span class="arrow">${icon("plus")}</span></a></div>
        <div class="filters"><label class="search">${icon("search")}<input id="ps" placeholder="Buscar equipo o marca" value="${esc(pFilter.q)}"></label></div>
        <div class="tabs">${["", ...CATS].map((c) => `<button class="chip ${pFilter.cat === c ? "active" : ""}" data-c="${c}">${c || "Todos"} <span>${products.filter((p) => !c || p.category === c).length}</span></button>`).join("")}</div>
        <div class="box" style="padding:6px 10px;overflow-x:auto"><table class="tbl">
          <thead><tr><th></th><th>Equipo</th><th class="hide-sm">Categoría</th><th class="num">$/día</th><th class="num">Stock</th><th>Sitio</th></tr></thead>
          <tbody>${rows.map((p) => `<tr class="click" data-go="#/equipos/${p.id}">
            <td><img class="thumb" src="${esc(p.images?.[0] || "")}" alt=""></td>
            <td><b style="font-weight:600">${esc(p.name)}</b><br><span class="muted" style="font-size:12px">${esc(p.brand)}${p.featured ? " · ★ Destacado" : ""}</span></td>
            <td class="hide-sm">${esc(p.category)}<br><span class="muted" style="font-size:12px">${esc(p.subcategory)}</span></td>
            <td class="num"><b>${m2(p.pricePerDay)}</b></td><td class="num">${p.stock}</td>
            <td>${p.active !== false ? `<span class="mini pagado">Visible</span>` : `<span class="mini anulado">Oculto</span>`}</td></tr>`).join("")}</tbody></table></div>`;
      const ps = document.getElementById("ps");
      ps.oninput = () => { pFilter.q = ps.value; draw(); const el = document.getElementById("ps"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    };
    draw();
    document.getElementById("main").onclick = (e) => {
      const c = e.target.closest("[data-c]"); if (c) { pFilter.cat = c.dataset.c; draw(); return; }
      const tr = e.target.closest("[data-go]"); if (tr) location.hash = tr.dataset.go;
    };
  }

  async function resizeImage(file) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob((b) => res(b), "image/webp", 0.85));
  }

  async function viewProduct(id) {
    shell("p", `<p class="muted">Cargando…</p>`);
    if (!products.length) products = await api("/products");
    const isNew = id === "nuevo";
    const orig = products.find((p) => p.id === id);
    if (!isNew && !orig) { document.getElementById("main").innerHTML = `<p>Equipo no encontrado. <a class="link-btn" href="#/equipos">Volver</a></p>`; return; }
    const p = JSON.parse(JSON.stringify(orig || { name: "", brand: "", category: "Cámaras", subcategory: "", description: "", pricePerDay: 0, stock: 1, active: true, featured: false, images: [], highlights: [], included: [], videoUrl: "" }));
    const cats = [...new Set([...CATS, ...products.map((x) => x.category)])];

    const drawImages = () => {
      document.getElementById("imgs").innerHTML = p.images.map((src, i) => `
        <div class="img-tile ${i ? "" : "first"}"><img src="${esc(src)}" alt="">
          <div class="tools"><button type="button" data-left="${i}" title="Mover a la izquierda">‹</button><button type="button" data-delimg="${i}" title="Quitar">×</button><button type="button" data-right="${i}" title="Mover a la derecha">›</button></div></div>`).join("") +
        `<label class="upload-tile">${icon("plus", 'width="20" height="20"')}<span>Subir fotos</span><input type="file" id="upl" accept="image/*" multiple hidden></label>`;
    };

    document.getElementById("main").innerHTML = `
      <form id="pf">
      <div class="page-head">
        <div><a href="#/equipos" class="link-btn">${icon("back", 'width="14" height="14" style="vertical-align:-2px"')} Equipos</a><h1 style="margin-top:6px">${isNew ? "Nuevo equipo" : esc(p.name)}</h1></div>
        <div style="display:flex;gap:8px">${!isNew ? `<a class="btn btn-ghost sm" href="/producto.html?id=${encodeURIComponent(p.id)}" target="_blank">Ver en sitio ${icon("ext", 'width="14" height="14"')}</a>` : ""}<button class="btn btn-dark sm" type="submit">Guardar<span class="arrow">${icon("arrow")}</span></button></div>
      </div>
      <div class="editor">
        <div>
          <div class="box"><h2>Información</h2>
            <div class="form-grid">
              <div class="field full"><label>Nombre *</label><input name="name" required value="${esc(p.name)}"></div>
              <div class="field"><label>Marca</label><input name="brand" value="${esc(p.brand)}" list="brands"></div>
              <div class="field"><label>Categoría</label><select name="category">${cats.map((c) => `<option ${p.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
              <div class="field"><label>Subcategoría</label><input name="subcategory" value="${esc(p.subcategory)}" placeholder="LED, Lentes, C-Stand…"></div>
              <div class="field"><label>Video (YouTube o Vimeo)</label><input name="videoUrl" value="${esc(p.videoUrl)}"></div>
              <div class="field full"><label>Descripción</label><textarea name="description" rows="6">${esc(p.description)}</textarea></div>
              <div class="field full"><label>Características (una por línea)</label><textarea name="highlights" rows="6">${esc(p.highlights.join("\n"))}</textarea></div>
              <div class="field full"><label>Qué incluye (uno por línea)</label><textarea name="included" rows="6">${esc(p.included.join("\n"))}</textarea></div>
            </div>
            <datalist id="brands">${[...new Set(products.map((x) => x.brand))].map((b) => `<option value="${esc(b)}">`).join("")}</datalist>
          </div>
        </div>
        <div>
          <div class="box"><h2>Precio y stock</h2>
            <div class="form-grid">
              <div class="field"><label>Precio por día ($)</label><input name="pricePerDay" type="number" min="0" step="0.01" value="${p.pricePerDay}"></div>
              <div class="field"><label>Unidades</label><input name="stock" type="number" min="0" value="${p.stock}"></div>
            </div>
            <div class="stack" style="margin-top:16px">
              <label class="switch"><input type="checkbox" name="active" ${p.active !== false ? "checked" : ""}> Visible en el sitio</label>
              <label class="switch"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}> Destacado en “Lo más pedido”</label>
              <label class="switch"><input type="checkbox" name="requiresTech" ${p.requiresTech ? "checked" : ""}> Sale únicamente con técnico de CHR</label>
              <div class="field"><label>Valor de reposición ($) — para el pagaré</label><input name="replacementValue" type="number" min="0" step="0.01" value="${p.replacementValue || ""}" placeholder="Vacío = 30 días de renta"></div>
            </div>
          </div>
          <div class="box"><h2>Fotos <span class="muted" style="font-size:11px;letter-spacing:0;text-transform:none">La primera es la principal</span></h2><div class="img-grid" id="imgs"></div><p class="muted" style="font-size:12px;margin:10px 0 0">Recomendado: fondo blanco, formato cuadrado.</p></div>
          ${!isNew ? `<div class="box"><button type="button" class="link-btn danger" id="delP">Eliminar equipo</button></div>` : ""}
        </div>
      </div></form>`;
    drawImages();

    const main = document.getElementById("main");
    main.onclick = async (e) => {
      const t = e.target;
      const swap = (i, j) => { if (j < 0 || j >= p.images.length) return; [p.images[i], p.images[j]] = [p.images[j], p.images[i]]; drawImages(); };
      if (t.closest("[data-delimg]")) { p.images.splice(Number(t.closest("[data-delimg]").dataset.delimg), 1); drawImages(); }
      if (t.closest("[data-left]")) { const i = Number(t.closest("[data-left]").dataset.left); swap(i, i - 1); }
      if (t.closest("[data-right]")) { const i = Number(t.closest("[data-right]").dataset.right); swap(i, i + 1); }
      if (t.closest("#delP")) {
        if (!confirm(`¿Eliminar "${p.name}" del catálogo? Si solo quiere ocultarlo, desactive “Visible en el sitio”.`)) return;
        try { await api(`/products/${p.id}`, { method: "DELETE" }); products = []; location.hash = "#/equipos"; toast("Equipo eliminado"); } catch (er) { toast(er.message); }
      }
    };
    main.onchange = async (e) => {
      if (e.target.id !== "upl") return;
      const files = [...e.target.files];
      toast(`Subiendo ${files.length} foto(s)…`);
      for (const f of files) {
        try {
          const blob = await resizeImage(f);
          const { url } = await api("/upload", { method: "POST", body: blob, headers: { "content-type": "image/webp" } });
          p.images.push(url); drawImages();
        } catch (er) { toast(er.message); }
      }
      toast("Fotos listas. Recuerde guardar.");
    };
    document.getElementById("pf").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        ...Object.fromEntries(fd), active: fd.get("active") === "on", featured: fd.get("featured") === "on", requiresTech: fd.get("requiresTech") === "on",
        highlights: fd.get("highlights"), included: fd.get("included"), images: p.images,
      };
      try {
        const saved = isNew ? await api("/products", { method: "POST", body }) : await api(`/products/${p.id}`, { method: "PUT", body });
        products = []; toast("Equipo guardado");
        if (isNew) location.hash = `#/equipos/${saved.id}`; else viewProduct(saved.id);
      } catch (er) { toast(er.message); }
    };
  }

  // ---------- Ajustes ----------
  async function viewSettings() {
    shell("s", `<p class="muted">Cargando…</p>`);
    settings = await api("/settings");
    document.getElementById("main").innerHTML = `
      <form id="sf">
      <div class="page-head"><div><h1>Ajustes</h1><p>Datos de contacto y reglas de cotización.</p></div><button class="btn btn-dark sm">Guardar<span class="arrow">${icon("arrow")}</span></button></div>
      <div class="editor">
        <div class="box"><h2>Cotizaciones</h2>
          <div class="form-grid">
            <div class="field"><label>IVA (%)</label><input name="ivaPercent" type="number" min="0" step="0.01" value="${settings.ivaPercent}"></div>
            <div class="field"><label>Anticipo sugerido (%)</label><input name="depositPercent" type="number" min="0" max="100" value="${settings.depositPercent}"></div>
            <div class="field full"><label>Términos mostrados en la cotización</label><textarea name="quoteTerms" rows="4">${esc(settings.quoteTerms)}</textarea></div>
          </div>
          <h2 style="margin-top:22px">Descuento por días</h2>
          <p class="muted" style="font-size:13px;margin:0 0 10px">Se aplica automáticamente el tramo mayor que alcance la renta. Deje en 0 para desactivar.</p>
          <div class="form-grid" style="grid-template-columns:repeat(3,1fr)">
            ${[0, 1, 2].map((i) => { const t = (settings.dayDiscounts || [])[i] || {}; return `<div class="field"><label>Tramo ${i + 1}</label><div style="display:flex;gap:6px;align-items:center"><input name="dd_min_${i}" type="number" min="0" value="${t.minDays || ""}" placeholder="días" style="width:50%"><span class="muted">+ días →</span><input name="dd_pct_${i}" type="number" min="0" max="100" value="${t.percent || ""}" placeholder="%" style="width:40%"></div></div>`; }).join("")}
          </div>
          <h2 style="margin-top:22px">Técnico de CamHouse</h2>
          <div class="form-grid">
            <div class="field"><label>Cargo por día ($)</label><input name="techFeePerDay" type="number" min="0" step="0.01" value="${settings.techFeePerDay}"></div>
            <div class="field full"><label>Aviso en la ficha del equipo</label><textarea name="techNote" rows="3">${esc(settings.techNote || "")}</textarea></div>
          </div>
          <h2 style="margin-top:22px">Cláusulas y pagaré</h2>
          <div class="form-grid">
            <div class="field full"><label>Cláusulas de renta (página /terminos.html; separe cada cláusula con una línea en blanco)</label><textarea name="clauses" rows="14">${esc(settings.clauses || "")}</textarea></div>
            <div class="field full"><label>Texto del pagaré — variables: {nombre} {empresa} {monto} {codigo} {fecha} {equipos}</label><textarea name="pagareText" rows="10">${esc(settings.pagareText || "")}</textarea></div>
          </div>
        </div>
        <div>
          <div class="box"><h2>Contacto</h2>
            <div class="stack">
              <div class="field"><label>WhatsApp (con código de país)</label><input name="whatsapp" value="${esc(settings.whatsapp)}" placeholder="50370000000"></div>
              <div class="field"><label>Correo</label><input name="email" type="email" value="${esc(settings.email)}"></div>
              <div class="field"><label>Dirección / ciudad</label><input name="address" value="${esc(settings.address)}"></div>
            </div>
          </div>
          <div class="box"><h2>Wompi</h2>
            <p style="font-size:14px;margin:0">${status.wompi ? "Conectado. Los enlaces de pago se generan en su cuenta de Wompi." : "Modo prueba: los enlaces son simulados. Para activar pagos reales, agregue <b>WOMPI_CLIENT_ID</b> y <b>WOMPI_CLIENT_SECRET</b> en Netlify → Site configuration → Environment variables, y vuelva a publicar."}</p>
            <p class="muted" style="font-size:12px;margin:10px 0 0">URL del webhook: <code>${esc(status.site)}/api/wompi/webhook</code></p>
          </div>
        </div>
      </div></form>`;
    document.getElementById("sf").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);
      body.dayDiscounts = [0, 1, 2].map((i) => ({ minDays: Number(fd.get(`dd_min_${i}`)) || 0, percent: Number(fd.get(`dd_pct_${i}`)) || 0 }));
      try { settings = await api("/settings", { method: "PUT", body }); toast("Ajustes guardados"); } catch (er) { toast(er.message); }
    };
  }

  // ---------- Router ----------
  async function route() {
    if (!token) return renderLogin();
    const h = location.hash.replace(/^#\/?/, "") || "cotizaciones";
    const [sec, id] = h.split("/");
    try {
      if (sec === "equipos") return id ? viewProduct(decodeURIComponent(id)) : viewProducts();
      if (sec === "ajustes") return viewSettings();
      return id ? viewQuote(decodeURIComponent(id)) : viewQuotes();
    } catch (er) { toast(er.message); }
  }

  async function boot() {
    if (!token) return renderLogin();
    try {
      [status, settings] = await Promise.all([api("/status"), api("/settings")]);
    } catch { return; }
    route();
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("unhandledrejection", (e) => toast(e.reason?.message || "Error"));
  boot();
})();
