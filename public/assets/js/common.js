/* CamHouse Rentals — utilidades compartidas: íconos, layout, carrito de cotización, drawer. */
(() => {
  // ---------- Íconos ----------
  const P = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
    camera: '<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
    lens: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M21 12h-5M12 21v-5M3 12h5"/>',
    light: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    grip: '<path d="M12 3v18M7 21h10M12 8l-6 6M12 8l6 6"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20a3 3 0 0 1-3 2h-3"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    whatsapp: '<path d="M3 21l1.7-4.6A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8a4 4 0 0 1-2.1-2.1l.8-1-1-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  };
  const icon = (name, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || ""}</svg>`;

  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const money2 = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000));
  const fmtDate = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" }) : "";

  const CAT_ICON = { "Cámaras": "camera", "Ópticas": "lens", "Iluminación": "light", "Gripería": "grip", "Kits": "box" };

  // ---------- API ----------
  let productsPromise, settingsPromise;
  const api = {
    products() {
      productsPromise ||= fetch("/api/products").then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .catch(() => fetch("/data/products.json").then((r) => r.json()));
      return productsPromise;
    },
    settings() {
      settingsPromise ||= fetch("/api/settings").then((r) => r.ok ? r.json() : {}).catch(() => ({}));
      return settingsPromise.then((s) => ({ ivaPercent: 13, depositPercent: 50, email: "camhouserental@gmail.com", whatsapp: "", address: "San Salvador, El Salvador", dayDiscounts: [{ minDays: 3, percent: 10 }, { minDays: 7, percent: 20 }], techFeePerDay: 75, ...s }));
    },
  };

  // ---------- Carrito (lista de cotización) ----------
  const KEY = "camhouse_quote_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let state = { items: [], startDate: "", endDate: "", client: {}, ...load() };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const listeners = new Set();
  const emit = () => { save(); listeners.forEach((fn) => fn(state)); };

  const cart = {
    get state() { return state; },
    count: () => state.items.reduce((s, i) => s + i.qty, 0),
    has: (id) => state.items.some((i) => i.id === id),
    add(id, qty = 1, max = 99) {
      const it = state.items.find((i) => i.id === id);
      if (it) it.qty = Math.min(max, it.qty + qty); else state.items.push({ id, qty: Math.min(max, qty) });
      emit();
    },
    setQty(id, qty, max = 99) {
      const it = state.items.find((i) => i.id === id); if (!it) return;
      it.qty = Math.max(1, Math.min(max, qty)); emit();
    },
    remove(id) { state.items = state.items.filter((i) => i.id !== id); emit(); },
    setDates(a, b) { state.startDate = a; state.endDate = b; emit(); },
    setClient(c) { state.client = { ...state.client, ...c }; save(); },
    clear() { state.items = []; emit(); },
    on: (fn) => listeners.add(fn),
  };

  // ---------- Layout ----------
  const header = () => `
  <header class="site-header" id="top">
    <div class="container nav">
      <a href="/" class="logo logo-spin" aria-label="CamHouse Rentals — inicio">
        <span class="logo-stack" id="logoStack">
          <img src="/img/logos/camhouse-script.png" alt="Camhouse" class="on">
          <img src="/img/logos/camhouse-stripes.png" alt="">
          <img src="/img/logos/camhouse-iguana.png" alt="">
        </span>
      </a>
      <nav class="nav-links" id="navLinks" aria-label="Principal">
        <a href="/?cat=Cámaras#catalogo" data-cat="Cámaras">Cámaras</a>
        <a href="/?cat=Ópticas#catalogo" data-cat="Ópticas">Ópticas</a>
        <a href="/?cat=Iluminación#catalogo" data-cat="Iluminación">Iluminación</a>
        <a href="/?cat=Gripería#catalogo" data-cat="Gripería">Gripería</a>
        <a href="/#como-funciona">Cómo rentar</a>
        <a href="/#contacto">Contacto</a>
      </nav>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="cart-btn" id="cartBtn" aria-label="Abrir mi cotización">
          <span class="label">Mi cotización</span><span class="count" id="cartCount">0</span>
        </button>
        <button class="menu-toggle" id="menuToggle" aria-label="Menú">${icon("menu")}</button>
      </div>
    </div>
  </header>`;

  const rail = () => `
  <nav class="side-rail" aria-label="Accesos rápidos">
    <a href="/#top" data-label="Inicio" class="active">${icon("home")}</a>
    <a href="/?cat=Cámaras#catalogo" data-cat="Cámaras" data-label="Cámaras">${icon("camera")}</a>
    <a href="/?cat=Ópticas#catalogo" data-cat="Ópticas" data-label="Ópticas">${icon("lens")}</a>
    <a href="/?cat=Iluminación#catalogo" data-cat="Iluminación" data-label="Iluminación">${icon("light")}</a>
    <a href="/?cat=Gripería#catalogo" data-cat="Gripería" data-label="Gripería">${icon("grip")}</a>
    <a href="#" data-open-cart data-label="Mi cotización">${icon("clipboard")}</a>
  </nav>`;

  const footer = (s) => `
  <footer class="site-footer" id="contacto">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="/" class="logo logo-spin lg">
            <span class="logo-stack">
              <img src="/img/logos/camhouse-script-white.png" alt="Camhouse" class="on">
              <img src="/img/logos/camhouse-stripes-white.png" alt="">
              <img src="/img/logos/camhouse-iguana.png" alt="">
            </span>
          </a>
          <p style="max-width:320px;font-size:14px;margin:0 0 16px">Renta de equipo profesional de cine y video en El Salvador: cámaras, ópticas, iluminación y gripería.</p>
          <span class="pay-badge">${icon("shield", 'width="14" height="14"')} Pagos seguros con Wompi</span>
        </div>
        <div>
          <h4>Catálogo</h4>
          <a href="/?cat=Cámaras#catalogo" data-cat="Cámaras">Cámaras</a>
          <a href="/?cat=Ópticas#catalogo" data-cat="Ópticas">Ópticas</a>
          <a href="/?cat=Iluminación#catalogo" data-cat="Iluminación">Iluminación</a>
          <a href="/?cat=Gripería#catalogo" data-cat="Gripería">Gripería</a>
          <a href="/?cat=Kits#catalogo" data-cat="Kits">Kits</a>
        </div>
        <div>
          <h4>Renta</h4>
          <a href="/#como-funciona">Cómo rentar</a>
          <a href="/terminos.html">Cláusulas y condiciones</a>
          <a href="/cotizacion.html">Mis cotizaciones</a>
          <a href="#" data-open-cart>Mi cotización</a>
        </div>
        <div>
          <h4>Contacto</h4>
          ${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ""}
          ${s.whatsapp ? `<a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">WhatsApp +${esc(s.whatsapp)}</a>` : ""}
          <a>${esc(s.address || "El Salvador")}</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} CamHouse Rentals. Todos los derechos reservados.</span>
        <span>Precios en USD por día de renta.</span>
      </div>
    </div>
  </footer>`;


  // Logo: gira 360° sobre su eje y alterna entre los tres logos de CamHouse
  function startLogoSpin() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stacks = () => [...document.querySelectorAll(".logo-stack")];
    const spin = () => stacks().forEach((st) => {
      st.classList.remove("flip"); void st.offsetWidth; st.classList.add("flip");
      setTimeout(() => {
        const imgs = [...st.querySelectorAll("img")];
        const i = imgs.findIndex((im) => im.classList.contains("on"));
        imgs[i].classList.remove("on"); imgs[(i + 1) % imgs.length].classList.add("on");
      }, 450);
    });
    setInterval(spin, 4000);
    document.addEventListener("mouseenter", (e) => { if (e.target.closest?.(".logo-spin")) spin(); }, true);
  }

  // ---------- Drawer de cotización ----------
  let step = 1, submitting = false, lastResult = null, errorMsg = "";

  const drawerShell = () => `
  <div class="overlay" id="overlay"></div>
  <aside class="drawer" id="drawer" aria-label="Mi cotización" aria-hidden="true">
    <div class="drawer-head">
      <div><h2>Mi cotización</h2><small id="drawerSub">Pre-cotización sin compromiso</small></div>
      <button class="close-btn" id="drawerClose" aria-label="Cerrar">${icon("x")}</button>
    </div>
    <div class="drawer-body" id="drawerBody"></div>
    <div class="drawer-foot" id="drawerFoot"></div>
  </aside>
  <div class="toast" id="toast" role="status"><span id="toastMsg"></span><button id="toastAction">Ver cotización</button></div>`;

  function totals(products, settings) {
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    const days = state.startDate && state.endDate ? daysBetween(state.startDate, state.endDate) : 1;
    const lines = state.items.map((i) => ({ ...i, p: byId[i.id] })).filter((l) => l.p);
    const perDay = lines.reduce((s, l) => s + l.p.pricePerDay * l.qty, 0);
    const equipment = perDay * days;
    const tiers = (settings.dayDiscounts || []).filter((t) => t.minDays > 0 && t.percent > 0).sort((a, b) => a.minDays - b.minDays);
    let pct = 0; for (const t of tiers) if (days >= t.minDays) pct = Number(t.percent);
    const nextTier = tiers.find((t) => t.minDays > days);
    const dayDiscount = equipment * pct / 100;
    const needsTech = lines.some((l) => l.p.requiresTech);
    const techFee = needsTech ? (Number(settings.techFeePerDay) || 0) * days : 0;
    const subtotal = equipment - dayDiscount + techFee;
    const iva = subtotal * (Number(settings.ivaPercent) || 0) / 100;
    return { lines, days, perDay, equipment, pct, nextTier, dayDiscount, needsTech, techFee, subtotal, iva, total: subtotal + iva };
  }

  async function renderDrawer() {
    const body = document.getElementById("drawerBody");
    const foot = document.getElementById("drawerFoot");
    if (!body) return;
    const [products, settings] = await Promise.all([api.products(), api.settings()]);
    const t = totals(products, settings);
    const steps = `<div class="steps-indicator">${[1, 2, 3].map((n) => `<i class="${n <= step ? "on" : ""}"></i>`).join("")}</div>`;

    if (step === 3 && lastResult) {
      const link = `${location.origin}/cotizacion.html?c=${encodeURIComponent(lastResult.code)}&k=${encodeURIComponent(lastResult.key)}`;
      const wa = `https://wa.me/${settings.whatsapp || ""}?text=${encodeURIComponent(`Hola CamHouse, envié la pre-cotización ${lastResult.code} desde el sitio web. ${link}`)}`;
      body.innerHTML = `${steps}
        <div class="success">
          <div class="big-ico">${icon("check")}</div>
          <h3>¡Solicitud enviada!</h3>
          <p style="color:var(--muted);margin:0">Su número de pre-cotización es</p>
          <div class="code">${esc(lastResult.code)}</div>
          <p style="font-size:14px;color:#3d3a52">Nuestro equipo revisará la disponibilidad para sus fechas y le contactará para confirmar. Cuando esté lista, podrá pagar en línea con Wompi desde el enlace de seguimiento.</p>
        </div>`;
      foot.innerHTML = `
        <a class="btn btn-dark btn-block" href="${link}">Ver seguimiento<span class="arrow">${icon("arrow")}</span></a>
        <a class="btn btn-ghost btn-block" style="margin-top:10px;justify-content:center" href="${wa}" target="_blank" rel="noopener">${icon("whatsapp", 'width="18" height="18"')} Enviar por WhatsApp</a>
        <button class="btn btn-ghost btn-block" style="margin-top:10px;justify-content:center" data-act="new">Nueva cotización</button>
        <p class="note" style="margin:12px 0 0;text-align:center">Le enviamos la confirmación y el enlace de seguimiento a ${esc(state.client?.email || "su correo")}. Ahí le avisaremos cuando CamHouse confirme su cotización.</p>`;
      return;
    }

    if (!t.lines.length) {
      step = 1;
      body.innerHTML = `<div class="empty-cart">${icon("clipboard")}<p><b style="color:var(--ink)">Su lista está vacía</b><br>Agregue equipos del catálogo para armar su pre-cotización.</p></div>${myQuotesHtml()}`;
      foot.innerHTML = `<a href="/#catalogo" class="btn btn-lime btn-block" data-act="close">Explorar catálogo<span class="arrow">${icon("arrow")}</span></a>`;
      return;
    }

    const minDate = todayISO();
    if (step === 1) {
      body.innerHTML = `${steps}
        <div class="dates">
          <div class="field"><label for="dStart">Retiro</label><input type="date" id="dStart" min="${minDate}" value="${esc(state.startDate)}"></div>
          <div class="field"><label for="dEnd">Devolución</label><input type="date" id="dEnd" min="${esc(state.startDate || minDate)}" value="${esc(state.endDate)}"></div>
        </div>
        ${state.startDate && state.endDate ? `<span class="days-pill">${icon("calendar", 'width="14" height="14"')} ${t.days} ${t.days === 1 ? "día" : "días"} de renta</span>` : `<p class="note" style="margin-top:0">Seleccione sus fechas para calcular el estimado.</p>`}
        ${errorMsg ? `<div class="alert">${esc(errorMsg)}</div>` : ""}
        ${t.lines.map((l) => `
          <div class="line-item">
            <img src="${esc(l.p.images?.[0] || "")}" alt="" loading="lazy">
            <div><h4>${esc(l.p.name)}</h4><div class="meta">${money(l.p.pricePerDay)} / día · ${l.p.stock} disp.${l.p.requiresTech ? ` · <b>sale con técnico CHR</b>` : ""}</div></div>
            <div class="right">
              <div class="qty" aria-label="Cantidad">
                <button data-act="dec" data-id="${l.id}" aria-label="Menos">−</button><span>${l.qty}</span>
                <button data-act="inc" data-id="${l.id}" aria-label="Más" ${l.qty >= l.p.stock ? "disabled style='opacity:.3'" : ""}>+</button>
              </div>
              <button class="remove" data-act="rm" data-id="${l.id}">Quitar</button>
            </div>
          </div>`).join("")}`;
      foot.innerHTML = `
        <div class="summary-row"><span>Equipo por día</span><span>${money2(t.perDay)}</span></div>
        <div class="summary-row"><span>Equipo (${t.days} ${t.days === 1 ? "día" : "días"})</span><span>${money2(t.equipment)}</span></div>
        ${t.pct ? `<div class="summary-row" style="color:var(--ok)"><span>Descuento por ${t.days} días (${t.pct}%)</span><span>−${money2(t.dayDiscount)}</span></div>` : ""}
        ${t.needsTech ? `<div class="summary-row"><span>Técnico de CamHouse (${t.days} ${t.days === 1 ? "día" : "días"})</span><span>${money2(t.techFee)}</span></div>` : ""}
        ${Number(settings.ivaPercent) ? `<div class="summary-row"><span>IVA (${settings.ivaPercent}%)</span><span>${money2(t.iva)}</span></div>` : ""}
        <div class="summary-row total"><span>Total estimado</span><span>${money2(t.total)}</span></div>
        ${t.nextTier && state.startDate ? `<p class="note" style="margin:6px 0 0;color:var(--ink)">${icon("tag", 'width="12" height="12" style="vertical-align:-1px"')} Con ${t.nextTier.minDays} días o más obtiene ${t.nextTier.percent}% de descuento en el equipo.</p>` : ""}
        <p class="note">Estimado sujeto a confirmación de disponibilidad. No se realiza ningún cobro en este paso.</p>
        <button class="btn btn-lime btn-block" data-act="next">Continuar<span class="arrow">${icon("arrow")}</span></button>`;
      return;
    }

    // step 2: datos
    const c = state.client || {};
    body.innerHTML = `${steps}
      <div class="alert info">${icon("calendar", 'width="14" height="14" style="vertical-align:-2px"')} ${fmtDate(state.startDate)} → ${fmtDate(state.endDate)} · ${t.days} ${t.days === 1 ? "día" : "días"} · ${cart.count()} equipos</div>
      ${errorMsg ? `<div class="alert">${esc(errorMsg)}</div>` : ""}
      <form id="clientForm" class="form-grid" novalidate>
        <div class="field full"><label for="cName">Nombre completo *</label><input id="cName" name="name" required autocomplete="name" value="${esc(c.name)}"></div>
        <div class="field full"><label for="cCompany">Empresa / productora</label><input id="cCompany" name="company" autocomplete="organization" value="${esc(c.company)}"></div>
        <div class="field"><label for="cEmail">Correo *</label><input id="cEmail" name="email" type="email" required autocomplete="email" value="${esc(c.email)}"></div>
        <div class="field"><label for="cPhone">Teléfono / WhatsApp *</label><input id="cPhone" name="phone" type="tel" required autocomplete="tel" value="${esc(c.phone)}" placeholder="7000-0000"></div>
        <div class="field"><label for="cType">Tipo de proyecto</label>
          <select id="cType" name="projectType">${["", "Comercial / publicidad", "Película / cortometraje", "Video musical", "Evento", "Contenido digital", "Corporativo", "Otro"].map((o) => `<option ${c.projectType === o ? "selected" : ""} value="${o}">${o || "Seleccione…"}</option>`).join("")}</select></div>
        <div class="field"><label for="cDelivery">Entrega</label>
          <select id="cDelivery" name="delivery">${["Retiro en CamHouse", "Entrega en locación"].map((o) => `<option ${c.delivery === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        <div class="field full"><label for="cNotes">Comentarios</label><textarea id="cNotes" name="notes" placeholder="Locación, horarios, técnico, equipo adicional que necesite…">${esc(c.notes)}</textarea></div>
      </form>`;
    foot.innerHTML = `
      <div class="summary-row total" style="border:0;margin:0;padding-top:0"><span>Total estimado</span><span>${money2(t.total)}</span></div>
      <label class="accept" style="margin:8px 0 12px"><input type="checkbox" id="cAccept" form="clientForm" name="acceptTerms" ${c.acceptTerms === "on" ? "checked" : ""}> <span>He leído y acepto las <a href="/terminos.html" target="_blank">cláusulas y condiciones de renta</a>, incluida la firma electrónica del pagaré de garantía antes de retirar el equipo.</span></label>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" data-act="back" style="padding:0 20px">Atrás</button>
        <button class="btn btn-lime" style="flex:1;justify-content:space-between" data-act="submit" ${submitting ? "disabled" : ""}>${submitting ? "Enviando…" : "Enviar pre-cotización"}<span class="arrow">${icon("send")}</span></button>
      </div>`;
    document.querySelectorAll("#clientForm input, #clientForm select, #clientForm textarea, #cAccept").forEach((el) =>
      el.addEventListener("input", () => cart.setClient({ [el.name]: el.type === "checkbox" ? (el.checked ? "on" : "") : el.value })));
  }

  async function submitQuote() {
    const form = document.getElementById("clientForm");
    const data = Object.fromEntries(new FormData(form));
    cart.setClient(data);
    if (!data.name?.trim() || !data.email?.trim() || !data.phone?.trim()) { errorMsg = "Complete nombre, correo y teléfono."; return renderDrawer(); }
    if (!/^\S+@\S+\.\S+$/.test(data.email)) { errorMsg = "Revise el correo electrónico."; return renderDrawer(); }
    if (!data.acceptTerms) { errorMsg = "Debe aceptar las cláusulas y condiciones de renta para continuar."; return renderDrawer(); }
    submitting = true; errorMsg = ""; renderDrawer();
    try {
      const r = await fetch("/api/quotes", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: state.items, startDate: state.startDate, endDate: state.endDate, client: data, acceptTerms: true }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error || "No se pudo enviar");
      lastResult = res;
      remember({ code: res.code, key: res.key, at: Date.now(), total: res.totals?.total });
      state.items = []; emit(); step = 3;
    } catch (e) {
      errorMsg = e.message || "No se pudo enviar. Intente de nuevo.";
    } finally {
      submitting = false; renderDrawer();
    }
  }

  // Cotizaciones recordadas en este navegador
  const MINE = "camhouse_quotes_v1";
  const mine = () => { try { return JSON.parse(localStorage.getItem(MINE)) || []; } catch { return []; } };
  function remember(q) { try { const l = mine().filter((x) => x.code !== q.code); l.unshift(q); localStorage.setItem(MINE, JSON.stringify(l.slice(0, 20))); } catch {} }
  const myQuotesHtml = () => {
    const l = mine();
    if (!l.length) return "";
    return `<div class="panel" style="margin:18px 0 0;padding:16px"><h3>Mis cotizaciones</h3>
      ${l.map((q) => `<a class="line-item" style="grid-template-columns:1fr auto;margin-bottom:8px" href="/cotizacion.html?c=${encodeURIComponent(q.code)}&k=${encodeURIComponent(q.key)}"><div><h4>${esc(q.code)}</h4><div class="meta">${new Date(q.at).toLocaleDateString("es-SV")}${q.total ? " · " + money2(q.total) : ""}</div></div><span class="link-btn" style="font-size:13px;text-decoration:underline">Ver estado</span></a>`).join("")}
      <p class="note" style="margin:6px 0 0">¿Cotizó desde otro dispositivo? <a href="/cotizacion.html" style="text-decoration:underline">Reciba sus cotizaciones por correo</a>.</p></div>`;
  };

  function openDrawer() {
    document.getElementById("toast")?.classList.remove("show");
    if (step === 3 && !lastResult) step = 1;
    document.getElementById("drawer").classList.add("open");
    document.getElementById("drawer").setAttribute("aria-hidden", "false");
    document.getElementById("overlay").classList.add("open");
    document.body.style.overflow = "hidden";
    renderDrawer();
  }
  function closeDrawer() {
    document.getElementById("drawer").classList.remove("open");
    document.getElementById("drawer").setAttribute("aria-hidden", "true");
    document.getElementById("overlay").classList.remove("open");
    document.body.style.overflow = "";
  }

  let toastTimer;
  function toast(msg, action = true) {
    const t = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    document.getElementById("toastAction").style.display = action ? "" : "none";
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function updateCount() {
    const el = document.getElementById("cartCount");
    if (!el) return;
    const n = cart.count();
    if (el.textContent !== String(n)) {
      el.textContent = n;
      const b = document.getElementById("cartBtn");
      b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    }
  }

  async function mount() {
    const h = document.getElementById("app-header");
    if (h) h.outerHTML = header() + (document.body.dataset.rail === "on" ? rail() : "");
    document.body.insertAdjacentHTML("beforeend", drawerShell());
    const f = document.getElementById("app-footer");
    if (f) api.settings().then((s) => { f.outerHTML = footer(s); });

    updateCount();
    startLogoSpin();
    cart.on(() => { updateCount(); if (document.getElementById("drawer").classList.contains("open")) renderDrawer(); });

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open-cart], #cartBtn, #toastAction");
      if (t) { e.preventDefault(); openDrawer(); return; }
      const a = e.target.closest("[data-act]");
      if (a && a.closest("#drawer")) {
        const id = a.dataset.id;
        api.products().then((products) => {
          const p = products.find((x) => x.id === id);
          switch (a.dataset.act) {
            case "inc": cart.setQty(id, (state.items.find((i) => i.id === id)?.qty || 0) + 1, p?.stock || 99); break;
            case "dec": cart.setQty(id, (state.items.find((i) => i.id === id)?.qty || 1) - 1, p?.stock || 99); break;
            case "rm": cart.remove(id); break;
            case "next":
              if (!state.startDate || !state.endDate) { errorMsg = "Seleccione las fechas de retiro y devolución."; renderDrawer(); break; }
              if (state.endDate < state.startDate) { errorMsg = "La devolución debe ser igual o posterior al retiro."; renderDrawer(); break; }
              errorMsg = ""; step = 2; renderDrawer(); break;
            case "back": errorMsg = ""; step = 1; renderDrawer(); break;
            case "submit": submitQuote(); break;
            case "new": lastResult = null; step = 1; renderDrawer(); break;
            case "close": closeDrawer(); break;
          }
        });
      }
      if (e.target.closest("#drawerClose") || e.target.id === "overlay") closeDrawer();
      if (e.target.closest("#menuToggle")) document.getElementById("navLinks").classList.toggle("open");
      if (e.target.closest(".nav-links a")) document.getElementById("navLinks").classList.remove("open");
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "dStart" || e.target.id === "dEnd") {
        let a = document.getElementById("dStart").value, b = document.getElementById("dEnd").value;
        if (a && (!b || b < a)) b = addDays(a, 1);
        errorMsg = ""; cart.setDates(a, b); renderDrawer();
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    window.addEventListener("scroll", () => document.querySelector(".site-header")?.classList.toggle("scrolled", scrollY > 10), { passive: true });

    // Animación de aparición
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
    const observe = () => document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    observe();
    new MutationObserver(observe).observe(document.body, { childList: true, subtree: true });
  }

  // Tarjeta de producto reutilizable
  const productCard = (p) => `
    <article class="card">
      <div class="card-media">
        <img src="${esc(p.images?.[0] || "")}" alt="${esc(p.name)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-tag">${esc(p.subcategory || p.category)}</span>
          ${p.requiresTech ? `<span class="card-stock tech" title="Sale únicamente con técnico de CamHouse">${icon("wrench", 'width="11" height="11"')} Con técnico</span>` : p.stock > 1 ? `<span class="card-stock">${p.stock} disp.</span>` : ""}
        </div>
        <span class="card-brand">${esc(p.brand)}</span>
        <h3 class="card-name"><a class="stretch" href="/producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <div class="card-foot">
          <span class="price">${money(p.pricePerDay)}<small>/día</small></span>
          <button class="icon-btn ${cart.has(p.id) ? "added" : ""}" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)} a la cotización">${icon(cart.has(p.id) ? "check" : "plus")}</button>
        </div>
      </div>
    </article>`;

  // Delegación global para botones "agregar"
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    e.preventDefault();
    const products = await api.products();
    const p = products.find((x) => x.id === b.dataset.add);
    if (!p) return;
    const qty = Number(b.dataset.qty || 1);
    cart.add(p.id, qty, p.stock || 99);
    document.querySelectorAll(`[data-add="${CSS.escape(p.id)}"].icon-btn`).forEach((el) => { el.classList.add("added"); el.innerHTML = icon("check"); });
    toast(`Agregado: ${p.name.length > 38 ? p.name.slice(0, 38) + "…" : p.name}`);
  });

  window.CH = { icon, money, money2, esc, api, cart, productCard, fmtDate, CAT_ICON, toast, openDrawer, todayISO, remember };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount) : mount();
})();
