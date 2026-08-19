/* ═══════════════════════════════════════════════════════════════════════════
   Pix2Prints — storefront catalog renderer  (TRD §6.3)
   ---------------------------------------------------------------------------
   Reads window.PIX2PRINTS and renders the product grid + category filter
   chips entirely at runtime. Each card routes into the editor with ?slug=.
   Adding a product is a config change only — nothing here changes.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CFG = window.PIX2PRINTS;
  var grid = document.getElementById("products");
  var chipsEl = document.getElementById("filter-chips");
  var countEl = document.getElementById("section-count");
  var searchEl = document.getElementById("search-input");

  if (!CFG || !Array.isArray(CFG.products)) {
    grid.innerHTML =
      '<p class="empty">Catalog failed to load. Check that config.js is present.</p>';
    return;
  }

  var activeCategory = "all";
  var searchTerm = "";

  /* ── Spec line for a product (circle vs rect vs split) ─────────────────── */
  function specText(p) {
    if (p.shape === "circle") return "\u2300 " + p.diameterMm + " mm";
    var base = p.widthMm + " \u00D7 " + p.heightMm + " mm";
    if (p.quantity === 2) base += " \u00B7 2 photos";
    return base;
  }

  /* ── Price string ("₹199"); empty if no price configured ───────────────── */
  function priceText(p) {
    if (p.price === undefined || p.price === null || p.price === "") return "";
    var cur = (CFG.app && CFG.app.currency) || "";
    return cur + p.price;
  }

  /* ── Category label lookup ─────────────────────────────────────────────── */
  function categoryLabel(id) {
    var found = (CFG.categories || []).find(function (c) { return c.id === id; });
    return found ? found.label : id;
  }

  /* ── Media tag: explicit badge → Split → category label ────────────────── */
  function tagInfo(p) {
    if (p.badge) return { text: p.badge, hot: true };
    if (p.quantity === 2) return { text: "Split", hot: true };
    return { text: categoryLabel(p.category), hot: false };
  }

  /* ── Images for a card: per-product override → global default → preview ── */
  function cardImages(p) {
    if (Array.isArray(p.images) && p.images.length) return p.images;
    if (CFG.app && Array.isArray(CFG.app.carouselImages) && CFG.app.carouselImages.length)
      return CFG.app.carouselImages;
    return p.preview ? [p.preview] : [];
  }

  var CHEVRON_LEFT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>';
  var CHEVRON_RIGHT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  var ARROW_GO =
    '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13m0 0-5-5m5 5-5 5" ' +
    'stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ── Build the carousel markup for one product ─────────────────────────── */
  function carouselMarkup(p) {
    var imgs = cardImages(p);
    var multi = imgs.length > 1;

    var slides = imgs.map(function (src) {
      return '<img class="carousel-slide" src="' + src +
        '" alt="" loading="lazy" draggable="false">';
    }).join("");

    var controls = "";
    if (multi) {
      var dots = imgs.map(function (_, i) {
        return '<span class="carousel-dot' + (i === 0 ? " active" : "") + '"></span>';
      }).join("");
      controls =
        '<button class="carousel-arrow prev" type="button" aria-label="Previous image">' +
          CHEVRON_LEFT + '</button>' +
        '<button class="carousel-arrow next" type="button" aria-label="Next image">' +
          CHEVRON_RIGHT + '</button>' +
        '<div class="carousel-dots">' + dots + '</div>';
    }

    return '<div class="carousel"' + (multi ? ' data-carousel' : '') + '>' +
             '<div class="carousel-track">' + slides + '</div>' +
             controls +
           '</div>';
  }

  /* ── Build one product card (whole card links into the editor) ─────────── */
  function cardMarkup(p) {
    var a = document.createElement("a");
    a.className = "card";
    a.href = "editor.html?slug=" + encodeURIComponent(p.slug);
    a.setAttribute("data-category", p.category);
    a.setAttribute("data-name", (p.name + " " + (p.subtitle || "")).toLowerCase());

    var tag = tagInfo(p);
    var price = priceText(p);

    a.innerHTML =
      '<div class="card__media">' +
        '<span class="card__tag' + (tag.hot ? " card__tag--hot" : "") + '">' + tag.text + '</span>' +
        carouselMarkup(p) +
      '</div>' +
      '<div class="card__body">' +
        '<div class="card__name">' + p.name + '</div>' +
        '<div class="card__variant">' + (p.subtitle || "") + '</div>' +
        '<span class="card__dim">' + specText(p) + '</span>' +
        '<div class="card__foot">' +
          '<span class="price"><small>From</small><b>' + price + '</b></span>' +
          '<span class="go" aria-hidden="true">' + ARROW_GO + '</span>' +
        '</div>' +
      '</div>';
    return a;
  }

  /* ── Wire up a card's carousel (arrows + dots) ─────────────────────────── */
  function wireCarousel(card) {
    var car = card.querySelector("[data-carousel]");
    if (!car) return;

    var track = car.querySelector(".carousel-track");
    var slides = car.querySelectorAll(".carousel-slide");
    var dots = car.querySelectorAll(".carousel-dot");
    var index = 0;

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      dots.forEach(function (d, di) { d.classList.toggle("active", di === index); });
    }

    // Controls live inside the <a>; stop the click from navigating to the editor.
    function intercept(e) { e.preventDefault(); e.stopPropagation(); }

    car.querySelector(".carousel-arrow.prev")
      .addEventListener("click", function (e) { intercept(e); go(index - 1); });
    car.querySelector(".carousel-arrow.next")
      .addEventListener("click", function (e) { intercept(e); go(index + 1); });
    dots.forEach(function (d, di) {
      d.addEventListener("click", function (e) { intercept(e); go(di); });
    });
  }

  function renderCards() {
    grid.innerHTML = "";
    CFG.products.forEach(function (p) {
      var card = cardMarkup(p);
      grid.appendChild(card);
      wireCarousel(card);
    });
  }

  /* ── Build filter chips: "All" + each configured category ──────────────── */
  function renderChips() {
    var cats = [{ id: "all", label: "All" }].concat(CFG.categories || []);
    chipsEl.innerHTML = "";
    cats.forEach(function (c) {
      var btn = document.createElement("button");
      btn.className = "chip";
      btn.type = "button";
      btn.textContent = c.label;
      btn.setAttribute("data-cat", c.id);
      btn.setAttribute("aria-pressed", c.id === activeCategory ? "true" : "false");
      btn.addEventListener("click", function () {
        activeCategory = c.id;
        renderChips();
        applyFilters();
      });
      chipsEl.appendChild(btn);
    });
  }

  /* ── Show/hide cards by active category + search term ──────────────────── */
  function applyFilters() {
    var visible = 0;
    grid.querySelectorAll(".card").forEach(function (card) {
      var catOk = activeCategory === "all" ||
        card.getAttribute("data-category") === activeCategory;
      var textOk = !searchTerm ||
        card.getAttribute("data-name").indexOf(searchTerm) !== -1;
      var show = catOk && textOk;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });
    countEl.textContent = visible + (visible === 1 ? " product" : " products");
    var empty = grid.querySelector(".empty");
    if (empty) empty.remove();
    if (visible === 0) {
      var msg = document.createElement("p");
      msg.className = "empty";
      msg.textContent = "No products match your filters.";
      grid.appendChild(msg);
    }
  }

  if (searchEl) {
    searchEl.addEventListener("input", function () {
      searchTerm = searchEl.value.trim().toLowerCase();
      applyFilters();
    });
  }

  renderChips();
  renderCards();
  applyFilters();
})();
