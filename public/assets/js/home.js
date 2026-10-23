/* Página de inicio: destacados, catálogo organizado por categorías, marcas. */
(async () => {
  const { api, productCard, esc, icon, CAT_ICON } = window.CH;
  const CAT_ORDER = ["Cámaras", "Ópticas", "Iluminación", "Gripería", "Kits"];
  const CAT_NOTE = { "Gripería": "Trípodes, stands, brazos, clamps y accesorios de soporte." };
  const $ = (id) => document.getElementById(id);

  let products = [];
  try { products = await api.products(); } catch { $("catalog").innerHTML = `<div class="empty">No se pudo cargar el catálogo. Recargue la página.</div>`; return; }

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  $("heroCount").textContent = products.length;
  $("statItems").textContent = products.length;
  $("statBrands").textContent = brands.length;
  $("brands").innerHTML = brands.map((b) => `<span>${esc(b)}</span>`).join("");
  $("brand").insertAdjacentHTML("beforeend", brands.map((b) => `<option>${esc(b)}</option>`).join(""));

  // Destacados
  const featured = products.filter((p) => p.featured);
  $("picksTrack").innerHTML = (featured.length ? featured : products.slice(0, 8)).map(productCard).join("");
  const track = $("picksTrack");
  const step = () => track.querySelector(".card")?.getBoundingClientRect().width + 18 || 300;
  $("picksPrev").onclick = () => track.scrollBy({ left: -step(), behavior: "smooth" });
  $("picksNext").onclick = () => track.scrollBy({ left: step(), behavior: "smooth" });

  // Catálogo por categorías
  const params = new URLSearchParams(location.search);
  const f = { q: params.get("q") || "", cat: params.get("cat") || "", brand: "", sort: "" };
  $("q").value = f.q;
  const cats = CAT_ORDER.filter((c) => products.some((p) => p.category === c))
    .concat([...new Set(products.map((p) => p.category))].filter((c) => !CAT_ORDER.includes(c)));
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function renderChips() {
    const count = (c) => products.filter((p) => !c || p.category === c).length;
    $("chips").innerHTML = ["", ...cats].map((c) =>
      `<button class="chip ${f.cat === c ? "active" : ""}" data-cat-chip="${esc(c)}">${c ? icon(CAT_ICON[c] || "box", 'width="15" height="15"') : ""}${c || "Todo"} <span>${count(c)}</span></button>`).join("");
  }

  function sortList(list) {
    if (f.sort === "price-asc") return [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (f.sort === "price-desc") return [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (f.sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return [...list].sort((a, b) => (a.subcategory || "").localeCompare(b.subcategory || "") || (b.featured - a.featured) || (a.order ?? 0) - (b.order ?? 0));
  }

  function renderCatalog() {
    const words = norm(f.q).split(/\s+/).filter(Boolean);
    const match = (p) => (!f.brand || p.brand === f.brand) &&
      words.every((w) => norm(`${p.name} ${p.brand} ${p.category} ${p.subcategory}`).includes(w));
    let total = 0;
    const html = cats.filter((c) => !f.cat || c === f.cat).map((c) => {
      const list = sortList(products.filter((p) => p.category === c && match(p)));
      if (!list.length) return "";
      total += list.length;
      return `
        <section class="cat-block" id="cat-${esc(norm(c).replace(/\s+/g, "-"))}">
          <div class="cat-head">
            <h3>${icon(CAT_ICON[c] || "box")}${esc(c)} <span>${list.length} ${list.length === 1 ? "equipo" : "equipos"}</span></h3>
            ${CAT_NOTE[c] ? `<p>${esc(CAT_NOTE[c])}</p>` : ""}
          </div>
          <div class="grid">${list.map(productCard).join("")}</div>
        </section>`;
    }).join("");
    $("catalog").innerHTML = total ? html : `<div class="empty"><b style="color:var(--ink)">Sin resultados</b><br>Pruebe con otro término o escríbanos: si no está en el catálogo, se lo conseguimos.</div>`;
  }

  function render() { renderChips(); renderCatalog(); }
  render();

  let t;
  $("q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; renderCatalog(); }, 150); });
  $("brand").addEventListener("change", (e) => { f.brand = e.target.value; renderCatalog(); });
  $("sort").addEventListener("change", (e) => { f.sort = e.target.value; renderCatalog(); });
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat-chip]");
    if (chip) { f.cat = chip.dataset.catChip; render(); $("catalogo").scrollIntoView({ behavior: "smooth" }); return; }
    const link = e.target.closest("a[data-cat]");
    if (link) { e.preventDefault(); f.cat = link.dataset.cat; render(); $("catalogo").scrollIntoView({ behavior: "smooth" }); document.getElementById("navLinks")?.classList.remove("open"); }
  });
  if (location.hash === "#catalogo") setTimeout(() => $("catalogo").scrollIntoView(), 50);
})();
