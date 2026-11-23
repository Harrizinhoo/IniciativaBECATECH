/* =========================================================
   PlazaViva — lógica de la aplicación (Vanilla JS, sin build)
   Persistencia: localStorage (capa "Store" fácil de sustituir
   por una API REST / Supabase / Firebase en producción).
   ========================================================= */
(() => {
  "use strict";

  // ---------- Utilidades ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const money = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (s = "") => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");

  const ICON = {
    store: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/></svg>',
    bag: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    arrow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    shop: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l1.5-5h15L21 9v2H3z"/><path d="M5 11v9h14v-9"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    upload: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#5B1F63" stroke-width="1.8" stroke-linecap="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>',
  };

  const OCCUPATIONS = {
    ciudadano: { label: "Ciudadano común", emoji: "🏠" },
    informal: { label: "Trabajador informal", emoji: "🛠️" },
    restaurante: { label: "Personal de restaurante / comidas", emoji: "🍽️" },
  };

  // ---------- Store (persistencia) ----------
  const KEY = "plazaviva_db_v1";
  const Store = {
    data: null,
    load() {
      try { this.data = JSON.parse(localStorage.getItem(KEY)); } catch { this.data = null; }
      if (!this.data) { this.data = { sellers: [], buyers: [], products: [], session: null }; seed(this.data); this.save(); }
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); return true; }
      catch { toast("Almacenamiento lleno: elimina productos o usa imágenes más livianas."); return false; }
    },
    get session() { return this.data.session; },
    set session(v) { this.data.session = v; this.save(); },
    seller(id) { return this.data.sellers.find((s) => s.id === id); },
    buyer(id) { return this.data.buyers.find((b) => b.id === id); },
  };

  // Productos demo para que la galería no arranque vacía
  function seed(db) {
    const svg = (emoji, c1, c2) =>
      "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><circle cx='320' cy='60' r='90' fill='white' opacity='.18'/><text x='200' y='190' font-size='130' text-anchor='middle'>${emoji}</text></svg>`);
    const s1 = { id: "demo-s1", name: "Rosa Martínez", store: "Frutas Doña Rosa", location: "Plaza de Mercado Paloquemao, local 14", demo: true };
    const s2 = { id: "demo-s2", name: "Jorge Pérez", store: "Panadería El Trigal", location: "Calle 45 #12-30, Chapinero", demo: true };
    db.sellers.push(s1, s2);
    const now = Date.now();
    db.products.push(
      { id: uid(), sellerId: s1.id, name: "Mangos Tommy (kg)", price: 3500, units: 12, image: svg("🥭", "#f0a46f", "#e07b39"), createdAt: now - 5e5 },
      { id: uid(), sellerId: s1.id, name: "Aguacate Hass", price: 1500, units: 20, image: svg("🥑", "#a8b88a", "#5b1f63"), createdAt: now - 4e5 },
      { id: uid(), sellerId: s2.id, name: "Pan campesino del día", price: 2000, units: 8, image: svg("🍞", "#efe4f1", "#7d3a86"), createdAt: now - 3e5 },
      { id: uid(), sellerId: s1.id, name: "Tomate chonto (lb)", price: 1200, units: 15, image: svg("🍅", "#e6e6e6", "#e07b39"), createdAt: now - 2e5 },
    );
  }

  // ---------- Imagen: compresión en el cliente ----------
  function compressImage(file, max = 900, quality = 0.78) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) return reject(new Error("Archivo no válido"));
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---------- Toast ----------
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("is-show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-show"), 2600);
  }

  // ---------- Modal ----------
  const modal = $("#modal"), panel = $("#modalPanel");
  function openModal(html, onMount) {
    panel.innerHTML = html; modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    onMount && onMount(panel);
    setTimeout(() => panel.querySelector("input:not([type=file]),select")?.focus(), 250);
  }
  function closeModal() {
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
  }
  const modalHead = (title, sub) => `
    <div class="modal__head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ""}</div>
    <button class="icon-btn" data-action="close-modal" aria-label="Cerrar">${ICON.close}</button></div>`;

  // ---------- Router mínimo por hash ----------
  const routes = { "": renderLanding, vendedor: renderSellerPanel, comprador: renderBuyerPanel };
  function go(route) {
    const target = route ? "#/" + route : "";
    if (location.hash.replace(/^#\/?$/, "") === target) return router(); // misma ruta: re-render
    location.hash = target;
  }
  function router() {
    const r = location.hash.replace(/^#\/?/, "");
    const s = Store.session;
    if (r === "vendedor" && s?.role !== "seller") return go("");
    if (r === "comprador" && s?.role !== "buyer") return go("");
    (routes[r] || renderLanding)();
    renderNav();
    updateCartBadge();
    if (r !== "comprador") closeCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderNav() {
    const s = Store.session, nav = $("#topnav");
    if (!s) { nav.innerHTML = `<span class="chip"><span class="hide-sm">Galería virtual de</span>&nbsp;productos locales</span>`; return; }
    const who = s.role === "seller" ? Store.seller(s.id)?.name : Store.buyer(s.id)?.firstName;
    nav.innerHTML = `
      <span class="chip chip--purple">${s.role === "seller" ? "Vendedor" : "Comprador"} · ${esc(who || "")}</span>
      ${s.role === "buyer" ? `<button class="chip cart-chip" data-action="cart-open">🛒 Carrito <b id="navCartCount">${cartCount()}</b></button>` : ""}
      <button class="btn btn--ghost btn--sm" data-action="logout">Salir</button>`;
  }

  // =========================================================
  // CARRITO DE COMPRAS (por comprador, persistido en Store)
  // =========================================================
  const currentBuyer = () => (Store.session?.role === "buyer" ? Store.buyer(Store.session.id) : null);
  const getCart = () => { const b = currentBuyer(); if (!b) return []; b.cart ||= []; return b.cart; };
  const inCart = (productId) => getCart().find((i) => i.productId === productId)?.qty || 0;
  const cartCount = () => getCart().reduce((a, i) => a + i.qty, 0);

  // Ítems válidos con su producto y vendedor; ajusta cantidades si el stock cambió
  function cartItems() {
    const b = currentBuyer(); if (!b) return [];
    b.cart = getCart().filter((i) => {
      const p = Store.data.products.find((x) => x.id === i.productId);
      if (!p || !Store.seller(p.sellerId) || p.units === 0) return false;
      i.qty = Math.min(i.qty, p.units);
      return true;
    });
    return b.cart.map((i) => {
      const product = Store.data.products.find((x) => x.id === i.productId);
      return { ...i, product, seller: Store.seller(product.sellerId), subtotal: i.qty * product.price };
    });
  }

  function addToCart(product, qty = 1) {
    const cart = getCart(), line = cart.find((i) => i.productId === product.id);
    const current = line?.qty || 0;
    if (current + qty > product.units) return toast("No hay más unidades disponibles de este producto");
    if (line) line.qty += qty; else cart.push({ productId: product.id, qty, addedAt: Date.now() });
    Store.save(); updateCartBadge(true);
    toast(`Agregado: ${product.name} ✓`);
  }

  function setCartQty(productId, qty) {
    const b = currentBuyer(); if (!b) return;
    const p = Store.data.products.find((x) => x.id === productId);
    if (qty <= 0) b.cart = getCart().filter((i) => i.productId !== productId);
    else { const line = getCart().find((i) => i.productId === productId); if (line) line.qty = Math.min(qty, p?.units ?? qty); }
    Store.save(); updateCartBadge();
  }

  function updateCartBadge(bump = false) {
    const fab = $("#cartFab"), isBuyer = Store.session?.role === "buyer" && location.hash === "#/comprador";
    fab.hidden = !isBuyer;
    const n = cartCount();
    $("#cartCount").textContent = n;
    const navC = $("#navCartCount"); if (navC) navC.textContent = n;
    if (bump) { fab.classList.remove("is-bump"); void fab.offsetWidth; fab.classList.add("is-bump"); }
  }

  const drawer = $("#drawer"), drawerPanel = $("#drawerPanel");
  function openCart() { renderCart(); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function closeCart() {
    if (!drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
  }

  function renderCart() {
    const items = cartItems();
    const head = (sub) => `
      <div class="drawer__head"><div><h3>Tu carrito</h3><p>${sub}</p></div>
      <button class="icon-btn" data-action="cart-close" aria-label="Cerrar carrito">${ICON.close}</button></div>`;

    if (!items.length) {
      drawerPanel.innerHTML = `${head("Sin productos aún")}
        <div class="drawer__body"><div class="empty"><b>Tu carrito está vacío</b>Agrega productos desde la galería para ver aquí el resumen de tu compra.</div></div>
        <div class="drawer__foot"><button class="btn btn--ghost btn--block" data-action="cart-close">Seguir explorando</button></div>`;
      return;
    }

    // Agrupar por local: el comprador recoge en cada establecimiento
    const groups = {};
    items.forEach((it) => (groups[it.seller.id] ||= { seller: it.seller, items: [] }).items.push(it));
    const total = items.reduce((a, i) => a + i.subtotal, 0);
    const units = items.reduce((a, i) => a + i.qty, 0);
    const nStores = Object.keys(groups).length;

    drawerPanel.innerHTML = `
      ${head(`${units} unidad${units !== 1 ? "es" : ""} · ${nStores} local${nStores !== 1 ? "es" : ""}`)}
      <div class="drawer__body">
        ${Object.values(groups).map((g) => `
          <section class="cart-group">
            <div class="cart-group__head">
              <div><b>${ICON.shop} ${esc(g.seller.store)}</b><small>${ICON.pin} ${esc(g.seller.location)}</small></div>
            </div>
            ${g.items.map((it) => `
              <div class="cart-line" data-id="${it.product.id}">
                <img src="${it.product.image}" alt="${esc(it.product.name)}" />
                <div>
                  <h5>${esc(it.product.name)}</h5>
                  <small>${money(it.product.price)} c/u · máx. ${it.product.units}</small>
                </div>
                <div class="cart-line__right">
                  <div class="stepper">
                    <button data-action="cart-qty" data-delta="-1" aria-label="Restar">−</button><b>${it.qty}</b><button data-action="cart-qty" data-delta="1" aria-label="Sumar" ${it.qty >= it.product.units ? "disabled" : ""}>+</button>
                  </div>
                  <b>${money(it.subtotal)}</b>
                </div>
              </div>`).join("")}
            <div class="cart-sub"><span>Subtotal ${esc(g.seller.store)}</span><b>${money(g.items.reduce((a, i) => a + i.subtotal, 0))}</b></div>
          </section>`).join("")}
      </div>
      <div class="drawer__foot">
        <div class="cart-row"><span>Productos</span><span>${items.length}</span></div>
        <div class="cart-row"><span>Unidades</span><span>${units}</span></div>
        <div class="cart-total"><span>Total</span><b>${money(total)}</b></div>
        <button class="btn btn--primary btn--block" data-action="checkout">Confirmar pedido</button>
        <button class="link-btn" data-action="cart-clear">Vaciar carrito</button>
      </div>`;
  }

  function checkout() {
    const b = currentBuyer(), items = cartItems();
    if (!items.length) return;
    const total = items.reduce((a, i) => a + i.subtotal, 0);
    const code = "PV-" + Date.now().toString(36).slice(-6).toUpperCase();
    items.forEach((it) => { it.product.units = Math.max(0, it.product.units - it.qty); });
    (Store.data.orders ||= []).push({
      id: code, buyerId: b.id, total, createdAt: Date.now(),
      items: items.map((i) => ({ productId: i.product.id, name: i.product.name, sellerId: i.seller.id, price: i.product.price, qty: i.qty })),
    });
    b.cart = [];
    Store.save(); updateCartBadge(); renderGallery();
    const stores = [...new Map(items.map((i) => [i.seller.id, i.seller])).values()];
    drawerPanel.innerHTML = `
      <div class="drawer__head"><div><h3>¡Pedido confirmado!</h3></div>
      <button class="icon-btn" data-action="cart-close" aria-label="Cerrar">${ICON.close}</button></div>
      <div class="drawer__body">
        <div class="receipt">
          <div class="receipt__icon">✓</div>
          <p>Código de pedido</p><code>${code}</code>
          <p>Total: <b>${money(total)}</b></p>
        </div>
        <div class="cart-group">
          <b>Recoge tus productos en:</b>
          ${stores.map((s) => `<div class="cart-group__head"><div><b>${ICON.shop} ${esc(s.store)}</b><small>${ICON.pin} ${esc(s.location)}</small></div></div>`).join("")}
        </div>
      </div>
      <div class="drawer__foot"><button class="btn btn--primary btn--block" data-action="cart-close">Seguir explorando</button></div>`;
  }

  // =========================================================
  // LANDING
  // =========================================================
  function renderLanding() {
    const db = Store.data;
    const units = db.products.reduce((a, p) => a + Number(p.units || 0), 0);
    $("#app").innerHTML = `
    <section class="view">
      <div class="hero">
        <div>
          <h1 class="hero__title">Lo que sobra en tu plaza, <em>llega a quien lo necesita</em></h1>
          <p class="hero__lead">PlazaViva es una galería virtual donde vendedores de plazas y establecimientos locales publican sus productos restantes, y compradores los obtienen a precios justos.</p>
          <div class="hero__stats">
            <div class="stat glass"><b>${db.products.length}</b><span>productos publicados</span></div>
            <div class="stat glass"><b>${units}</b><span>unidades disponibles</span></div>
            <div class="stat glass"><b>${db.sellers.length}</b><span>locales aliados</span></div>
          </div>
        </div>
        <div class="hero__art"><img src="assets/hero.jpg" alt="Ilustración de una compradora consultando productos locales en su móvil" /></div>
      </div>

      <div class="choices">
        <button class="choice choice--seller glass" data-action="seller-entry">
          <div class="choice__icon">${ICON.store}</div>
          <div>
            <span class="choice__tag">Para vendedores</span>
            <h2>Soy vendedor</h2>
            <p>Publica en segundos los productos que te quedaron del día: foto, nombre, precio y unidades. Gestiona tu inventario desde un panel simple.</p>
          </div>
          <span class="choice__cta">Publicar producto ${ICON.arrow}</span>
        </button>
        <button class="choice choice--buyer glass" data-action="buyer-entry">
          <div class="choice__icon">${ICON.bag}</div>
          <div>
            <span class="choice__tag">Para compradores</span>
            <h2>Soy comprador</h2>
            <p>Regístrate y explora todos los productos disponibles en las plazas y locales cercanos, con su precio, unidades y ubicación.</p>
          </div>
          <span class="choice__cta">Ver productos ${ICON.arrow}</span>
        </button>
      </div>
    </section>`;
  }

  // =========================================================
  // VENDEDOR — modal de publicación
  // =========================================================
  function openProductModal({ firstTime = false, product = null } = {}) {
    const editing = !!product;
    openModal(`
      ${modalHead(editing ? "Editar producto" : firstTime ? "Publica tu primer producto" : "Nuevo producto",
        firstTime ? "Adjunta la imagen del producto a revender y completa tus datos de vendedor." : "Adjunta la imagen y completa la información del producto.")}
      <form class="form" id="productForm" novalidate>
        <label class="dropzone" id="dropzone">
          <input type="file" name="image" accept="image/*" ${editing ? "" : "required"} />
          ${editing ? `<img src="${product.image}" alt="" />` : ""}
          <div class="dropzone__hint">${ICON.upload}<br/><b>Haz clic o arrastra</b> una imagen del producto<br/><small>JPG, PNG o WEBP</small></div>
        </label>

        <fieldset class="fieldset">
          <legend>Producto</legend>
          <div class="form__grid form__grid--3">
            <div class="field"><label for="pName">Nombre del producto</label><input class="input" id="pName" name="name" required maxlength="60" placeholder="Ej. Mangos Tommy (kg)" value="${esc(product?.name)}" /></div>
            <div class="field"><label for="pPrice">Precio (COP)</label><input class="input" id="pPrice" name="price" type="number" min="0" step="50" required placeholder="3500" value="${product?.price ?? ""}" /></div>
            <div class="field"><label for="pUnits">Unidades</label><input class="input" id="pUnits" name="units" type="number" min="1" step="1" required placeholder="10" value="${product?.units ?? ""}" /></div>
          </div>
        </fieldset>

        ${firstTime ? `
        <fieldset class="fieldset">
          <legend>Vendedor y local</legend>
          <div class="form__grid">
            <div class="field"><label for="sName">Nombre del vendedor</label><input class="input" id="sName" name="sellerName" required maxlength="60" placeholder="Nombre y apellido" /></div>
            <div class="field"><label for="sStore">Nombre del local</label><input class="input" id="sStore" name="store" required maxlength="60" placeholder="Ej. Frutas Doña Rosa" /></div>
          </div>
          <div class="field"><label for="sLoc">Ubicación del local</label><input class="input" id="sLoc" name="location" required maxlength="120" placeholder="Plaza / dirección, local o puesto" /></div>
        </fieldset>` : ""}

        <button class="btn btn--primary btn--block" type="submit">${editing ? "Guardar cambios" : "Subir producto"}</button>
      </form>`, (root) => {
      const form = $("#productForm", root), dz = $("#dropzone", root), fileInput = dz.querySelector("input");
      let imageData = product?.image || null;

      const showPreview = async (file) => {
        try {
          imageData = await compressImage(file);
          dz.querySelector("img")?.remove();
          dz.insertAdjacentHTML("beforeend", `<img src="${imageData}" alt="Vista previa" />`);
        } catch { toast("No se pudo leer la imagen"); }
      };
      fileInput.addEventListener("change", (e) => e.target.files[0] && showPreview(e.target.files[0]));
      ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-drag"); }));
      ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-drag"); }));
      dz.addEventListener("drop", (e) => e.dataTransfer.files[0] && showPreview(e.dataTransfer.files[0]));

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(form));
        if (!imageData) return toast("Adjunta una imagen del producto");
        const required = ["name", "price", "units", ...(firstTime ? ["sellerName", "store", "location"] : [])];
        const missing = required.find((k) => !String(f[k] || "").trim());
        if (missing) { form.elements[missing].focus(); return toast("Completa todos los campos"); }
        if (Number(f.price) < 0 || Number(f.units) < 1) return toast("Revisa precio y unidades");

        const db = Store.data;
        let sellerId = Store.session?.role === "seller" ? Store.session.id : null;
        if (firstTime) {
          const seller = { id: uid(), name: f.sellerName.trim(), store: f.store.trim(), location: f.location.trim(), createdAt: Date.now() };
          db.sellers.push(seller); sellerId = seller.id;
          db.session = { role: "seller", id: sellerId };
        }
        if (editing) {
          Object.assign(product, { name: f.name.trim(), price: Number(f.price), units: Number(f.units), image: imageData });
        } else {
          db.products.unshift({ id: uid(), sellerId, name: f.name.trim(), price: Number(f.price), units: Number(f.units), image: imageData, createdAt: Date.now() });
        }
        if (!Store.save()) return;
        closeModal();
        toast(editing ? "Producto actualizado ✓" : "Producto publicado ✓");
        location.hash === "#/vendedor" ? router() : go("vendedor");
      });
    });
  }

  // =========================================================
  // VENDEDOR — panel de inventario
  // =========================================================
  function renderSellerPanel() {
    const s = Store.seller(Store.session.id);
    if (!s) { Store.session = null; return go(""); }
    const items = Store.data.products.filter((p) => p.sellerId === s.id);
    const units = items.reduce((a, p) => a + p.units, 0);
    const value = items.reduce((a, p) => a + p.units * p.price, 0);

    $("#app").innerHTML = `
    <section class="view">
      <div class="dash-head">
        <div><h1>Hola, ${esc(s.name.split(" ")[0])} 👋</h1><p>Inventario de <b>${esc(s.store)}</b></p></div>
        <div class="dash-actions">
          <button class="btn btn--ghost" data-action="home">Inicio</button>
          <button class="btn btn--primary" data-action="new-product">+ Subir producto</button>
        </div>
      </div>

      <div class="seller-layout">
        <div>
          <div class="kpis">
            <div class="kpi glass"><span>Productos</span><b>${items.length}</b></div>
            <div class="kpi glass"><span>Unidades</span><b>${units}</b></div>
            <div class="kpi glass"><span>Valor inventario</span><b>${money(value)}</b></div>
          </div>
          <div class="card glass">
            <div class="card__title">Inventario <span class="badge">${items.length} publicados</span></div>
            <div class="inv-list">
              ${items.length ? items.map((p) => `
                <div class="inv-item ${p.units === 0 ? "is-soldout" : ""}" data-id="${p.id}">
                  <img src="${p.image}" alt="${esc(p.name)}" />
                  <div>
                    <h4>${esc(p.name)}</h4>
                    <div class="inv-item__meta">
                      <span class="badge badge--orange">${money(p.price)}</span>
                      <span class="badge ${p.units ? "" : "badge--gray"}">${p.units ? p.units + " und." : "Agotado"}</span>
                    </div>
                  </div>
                  <div class="inv-item__ctrl">
                    <div class="stepper" aria-label="Unidades">
                      <button data-action="units" data-delta="-1" aria-label="Restar">−</button><b>${p.units}</b><button data-action="units" data-delta="1" aria-label="Sumar">+</button>
                    </div>
                    <button class="btn btn--ghost btn--sm" data-action="edit-product">Editar</button>
                    <button class="icon-btn" data-action="delete-product" aria-label="Eliminar">${ICON.trash}</button>
                  </div>
                </div>`).join("") : `<div class="empty"><b>Aún no tienes productos</b>Sube tu primer producto restante del día.</div>`}
            </div>
          </div>
        </div>

        <aside class="card glass">
          <div class="profile">
            <div class="avatar">${esc(initials(s.name))}</div>
            <h4>${esc(s.name)}</h4>
            <small>${ICON.shop} ${esc(s.store)}</small>
            <small>${ICON.pin} ${esc(s.location)}</small>
          </div>
          <div class="card__title">Configuración de cuenta</div>
          <div class="settings">
            <button class="btn btn--ghost btn--block" data-action="edit-account">Editar datos del local</button>
            <button class="btn btn--ghost btn--block" data-action="clear-soldout">Quitar productos agotados</button>
            <button class="btn btn--ghost btn--block" data-action="logout">Cerrar sesión</button>
            <button class="btn btn--danger btn--block" data-action="delete-account">Eliminar cuenta</button>
          </div>
        </aside>
      </div>
    </section>`;
  }

  function openAccountModal() {
    const s = Store.seller(Store.session.id);
    openModal(`
      ${modalHead("Configuración de cuenta", "Actualiza la información que ven los compradores.")}
      <form class="form" id="accForm">
        <div class="form__grid">
          <div class="field"><label>Nombre del vendedor</label><input class="input" name="name" required value="${esc(s.name)}" /></div>
          <div class="field"><label>Nombre del local</label><input class="input" name="store" required value="${esc(s.store)}" /></div>
        </div>
        <div class="field"><label>Ubicación del local</label><input class="input" name="location" required value="${esc(s.location)}" /></div>
        <button class="btn btn--primary btn--block">Guardar</button>
      </form>`, (root) => {
      $("#accForm", root).addEventListener("submit", (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        if (Object.values(f).some((v) => !v.trim())) return toast("Completa todos los campos");
        Object.assign(s, { name: f.name.trim(), store: f.store.trim(), location: f.location.trim() });
        Store.save(); closeModal(); toast("Cuenta actualizada ✓"); router();
      });
    });
  }

  // =========================================================
  // COMPRADOR — registro
  // =========================================================
  function openBuyerModal() {
    openModal(`
      ${modalHead("Registro de comprador", "Cuéntanos quién eres para mostrarte los productos disponibles.")}
      <form class="form" id="buyerForm" novalidate>
        <div class="form__grid">
          <div class="field"><label for="bFirst">Nombre(s)</label><input class="input" id="bFirst" name="firstName" required maxlength="40" placeholder="Ej. Laura" /></div>
          <div class="field"><label for="bLast">Apellidos</label><input class="input" id="bLast" name="lastName" required maxlength="60" placeholder="Ej. Gómez Ruiz" /></div>
        </div>
        <div class="field"><label for="bAddr">Dirección de vivienda</label><input class="input" id="bAddr" name="address" required maxlength="120" placeholder="Calle, número, barrio, ciudad" /></div>
        <div class="field">
          <label>Ocupación</label>
          <div class="occupations">
            ${Object.entries(OCCUPATIONS).map(([k, o]) => `
              <label class="occ"><input type="radio" name="occupation" value="${k}" required /><span><i>${o.emoji}</i>${o.label}</span></label>`).join("")}
          </div>
        </div>
        <button class="btn btn--orange btn--block" type="submit">VER PRODUCTOS DISPONIBLES</button>
      </form>`, (root) => {
      $("#buyerForm", root).addEventListener("submit", (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        const missing = ["firstName", "lastName", "address"].find((k) => !String(f[k] || "").trim());
        if (missing) { e.target.elements[missing].focus(); return toast("Completa todos los campos"); }
        if (!f.occupation) return toast("Selecciona tu ocupación");
        const buyer = { id: uid(), firstName: f.firstName.trim(), lastName: f.lastName.trim(), address: f.address.trim(), occupation: f.occupation, createdAt: Date.now() };
        Store.data.buyers.push(buyer);
        Store.data.session = { role: "buyer", id: buyer.id };
        Store.save(); closeModal(); toast(`¡Bienvenido/a, ${buyer.firstName}!`); go("comprador");
      });
    });
  }

  // =========================================================
  // COMPRADOR — galería de productos
  // =========================================================
  const filters = { q: "", store: "", sort: "recent" };
  function renderBuyerPanel() {
    const b = Store.buyer(Store.session.id);
    if (!b) { Store.session = null; return go(""); }
    const sellers = Store.data.sellers.filter((s) => Store.data.products.some((p) => p.sellerId === s.id));

    $("#app").innerHTML = `
    <section class="view">
      <div class="dash-head">
        <div><h1>Productos disponibles</h1><p>${esc(b.firstName)} · ${OCCUPATIONS[b.occupation]?.emoji} ${OCCUPATIONS[b.occupation]?.label}</p></div>
        <div class="dash-actions"><button class="btn btn--ghost" data-action="home">Inicio</button><button class="btn btn--primary" data-action="cart-open">🛒 Ver carrito</button></div>
      </div>
      <div class="toolbar glass">
        <input class="input" id="fq" type="search" placeholder="Buscar producto, local o ubicación…" value="${esc(filters.q)}" />
        <select class="input" id="fstore">
          <option value="">Todos los locales</option>
          ${sellers.map((s) => `<option value="${s.id}" ${filters.store === s.id ? "selected" : ""}>${esc(s.store)}</option>`).join("")}
        </select>
        <select class="input" id="fsort">
          <option value="recent" ${filters.sort === "recent" ? "selected" : ""}>Más recientes</option>
          <option value="price-asc" ${filters.sort === "price-asc" ? "selected" : ""}>Menor precio</option>
          <option value="price-desc" ${filters.sort === "price-desc" ? "selected" : ""}>Mayor precio</option>
        </select>
      </div>
      <div class="gallery" id="gallery"></div>
    </section>`;

    const update = () => { filters.q = $("#fq").value; filters.store = $("#fstore").value; filters.sort = $("#fsort").value; renderGallery(); };
    $("#fq").addEventListener("input", update);
    $("#fstore").addEventListener("change", update);
    $("#fsort").addEventListener("change", update);
    renderGallery();
  }

  function renderGallery() {
    const q = filters.q.trim().toLowerCase();
    let list = Store.data.products
      .map((p) => ({ ...p, seller: Store.seller(p.sellerId) }))
      .filter((p) => p.seller)
      .filter((p) => !filters.store || p.sellerId === filters.store)
      .filter((p) => !q || [p.name, p.seller.store, p.seller.location, p.seller.name].join(" ").toLowerCase().includes(q));
    const sorters = { recent: (a, b) => b.createdAt - a.createdAt, "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price };
    list.sort((a, b) => (a.units === 0) - (b.units === 0) || sorters[filters.sort](a, b));

    $("#gallery").innerHTML = list.length ? list.map((p) => `
      <article class="product glass ${p.units === 0 ? "is-soldout" : ""}" data-id="${p.id}">
        <div class="product__img">
          <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" />
          <span class="product__price glass glass--strong">${money(p.price)}</span>
          <span class="product__units badge ${p.units ? "" : "badge--gray"}">${p.units ? p.units + " disponibles" : "Agotado"}</span>
        </div>
        <div class="product__body">
          <h4>${esc(p.name)}</h4>
          <div class="product__seller">
            <span>${ICON.shop} <b>${esc(p.seller.store)}</b></span>
            <span>${ICON.user} ${esc(p.seller.name)}</span>
            <span>${ICON.pin} ${esc(p.seller.location)}</span>
          </div>
          <div class="product__foot">
            ${(() => {
              const qty = inCart(p.id), left = p.units - qty;
              if (!p.units) return `<button class="btn btn--primary btn--block btn--sm" disabled>Sin unidades</button>`;
              return `${qty ? `<span class="product__incart">🛒 ${qty} en tu carrito</span>` : ""}
                <button class="btn ${qty ? "btn--orange" : "btn--primary"} btn--block btn--sm" data-action="add-to-cart" ${left ? "" : "disabled"}>${left ? (qty ? "Agregar otra unidad" : "Agregar al carrito") : "Máximo en carrito"}</button>`;
            })()}
          </div>
        </div>
      </article>`).join("") : `<div class="empty glass card" style="grid-column:1/-1"><b>No hay productos que coincidan</b>Prueba con otra búsqueda o vuelve más tarde.</div>`;
  }

  // =========================================================
  // Delegación global de eventos
  // =========================================================
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const itemId = el.closest("[data-id]")?.dataset.id;
    const product = itemId && Store.data.products.find((p) => p.id === itemId);
    const s = Store.session;

    switch (action) {
      case "home": e.preventDefault(); go(""); break;
      case "close-modal": closeModal(); break;
      case "seller-entry":
        if (s?.role === "seller") go("vendedor");
        else openProductModal({ firstTime: true });
        break;
      case "buyer-entry":
        if (s?.role === "buyer") go("comprador");
        else openBuyerModal();
        break;
      case "new-product": openProductModal(); break;
      case "edit-product": openProductModal({ product }); break;
      case "units":
        product.units = Math.max(0, product.units + Number(el.dataset.delta));
        Store.save(); router(); break;
      case "delete-product":
        if (confirm(`¿Eliminar "${product.name}"?`)) {
          Store.data.products = Store.data.products.filter((p) => p.id !== itemId);
          Store.save(); toast("Producto eliminado"); router();
        }
        break;
      case "edit-account": openAccountModal(); break;
      case "clear-soldout":
        Store.data.products = Store.data.products.filter((p) => !(p.sellerId === s.id && p.units === 0));
        Store.save(); toast("Agotados eliminados"); router(); break;
      case "delete-account":
        if (confirm("¿Eliminar tu cuenta y todos tus productos? Esta acción no se puede deshacer.")) {
          Store.data.products = Store.data.products.filter((p) => p.sellerId !== s.id);
          Store.data.sellers = Store.data.sellers.filter((x) => x.id !== s.id);
          Store.data.session = null; Store.save(); toast("Cuenta eliminada"); go("");
        }
        break;
      case "add-to-cart":
        if (product) { addToCart(product); renderGallery(); }
        break;
      case "cart-open": openCart(); break;
      case "cart-close": closeCart(); break;
      case "cart-qty":
        setCartQty(itemId, inCart(itemId) + Number(el.dataset.delta));
        renderCart(); renderGallery(); break;
      case "cart-clear":
        if (confirm("¿Vaciar el carrito?")) { currentBuyer().cart = []; Store.save(); updateCartBadge(); renderCart(); renderGallery(); }
        break;
      case "checkout": checkout(); break;
      case "logout": Store.session = null; toast("Sesión cerrada"); go(""); break;
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeCart(); } });
  window.addEventListener("hashchange", router);

  // ---------- Arranque ----------
  Store.load();
  router();
})();
