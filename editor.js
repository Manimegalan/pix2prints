/* ═══════════════════════════════════════════════════════════════════════════
   Pix2Prints — frame-fit editor
   ---------------------------------------------------------------------------
   Reads the product slug from the URL, looks it up in window.PIX2PRINTS, and
   hosts frame-fit editing + 300-DPI export + multipart upload.

   Coordinate model (TRD §7): placement is stored NORMALISED to the slot —
   offsetX/offsetY as a fraction of slot size, scaleW/scaleH as a multiplier
   vs. the cover-fit baseline — so the on-screen placement reproduces exactly
   at the print resolution regardless of the display size at export time.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CFG = window.PIX2PRINTS || {};
  var MM_PER_INCH = 25.4;
  var DPI = (CFG.app && CFG.app.dpi) || 300;
  var ENDPOINT = (CFG.app && CFG.app.uploadEndpoint) || "";

  /* ── Resolve product from ?slug= (TRD §5) ──────────────────────────────── */
  var slug = new URLSearchParams(location.search).get("slug");
  var product = (CFG.products || []).find(function (p) { return p.slug === slug; });

  if (!product) {
    var nf = document.getElementById("notfound");
    var msg = document.getElementById("nf-msg");
    if (msg) {
      msg.textContent = slug
        ? 'We couldn\u2019t find a product for "' + slug + '". It may have been renamed or removed.'
        : "No product was specified. Head back to the catalog to pick one.";
    }
    nf.classList.add("show");
    return; // never attempt to render a frame
  }

  /* ── Derive geometry from config ───────────────────────────────────────── */
  var IS_CIRCLE = product.shape === "circle";
  var QTY = (product.shape === "rect" && product.quantity === 2) ? 2 : 1; // split only valid for rect
  var IS_SPLIT = QTY === 2;
  var FRAME_W_MM = IS_CIRCLE ? product.diameterMm : product.widthMm;
  var FRAME_H_MM = IS_CIRCLE ? product.diameterMm : product.heightMm;
  var SLOT_W_MM = FRAME_W_MM / QTY; // per-half width for split

  /* ── Per-frame placement state (normalised) ────────────────────────────── */
  function newState() {
    return {
      offsetX: 0, offsetY: 0,      // fraction of slot (0 = centered)
      scaleW: 1, scaleH: 1,        // multiplier vs cover-fit (1 = cover)
      rot: 0, flipH: false, flipV: false, linked: true,
      hasImage: false, imgSrc: "", imgName: "",
      baseW: 0, baseH: 0,          // cover-fit px at current display size
      natAsp: 1                    // natural image aspect (w/h)
    };
  }
  var frames = [newState(), newState()];
  var activeFrame = 0;

  /* ── DOM refs ──────────────────────────────────────────────────────────── */
  var fo = document.getElementById("frame-outer");
  var fileInput = document.getElementById("file-input");
  var statusDot = document.getElementById("status-dot");
  var imgNameEl = document.getElementById("img-name");
  var toastEl = document.getElementById("toast");
  var toastIc = document.getElementById("toast-ic");
  var toastMsg = document.getElementById("toast-msg");

  var sliders = {
    tx: document.getElementById("tx"), ty: document.getElementById("ty"),
    sw: document.getElementById("sw"), sh: document.getElementById("sh"),
    rot: document.getElementById("rot")
  };
  var vals = {
    tx: document.getElementById("tx-val"), ty: document.getElementById("ty-val"),
    sw: document.getElementById("sw-val"), sh: document.getElementById("sh-val"),
    rot: document.getElementById("rot-val")
  };

  /* ── Frame pixel sizing (fit into the stage well) ──────────────────────── */
  var FW = 300, FH = 300, SLOT_W = 300;
  function computeFramePx() {
    var well = document.getElementById("well");
    var pad = 20; // matches #well padding
    var availW = well.clientWidth - pad * 2;
    var availH = well.clientHeight - pad * 2;
    var aspect = FRAME_W_MM / FRAME_H_MM; // total item aspect (split halves sum to width)
    var fw, fh;
    if (availW / availH > aspect) { fh = availH; fw = Math.round(fh * aspect); }
    else { fw = availW; fh = Math.round(fw / aspect); }
    FW = fw; FH = fh; SLOT_W = IS_SPLIT ? Math.round(fw / 2) : fw;
    fo.style.width = fw + "px";
    fo.style.height = fh + "px";
  }

  /* ── Build slot DOM ────────────────────────────────────────────────────── */
  function buildFrames() {
    fo.innerHTML = "";
    for (var i = 0; i < QTY; i++) {
      // ghost lives OUTSIDE the slot so overflow:hidden doesn't clip it
      var ghost = document.createElement("div");
      ghost.className = "slot-ghost";
      ghost.innerHTML = '<img alt="" draggable="false">';
      fo.appendChild(ghost);

      var slot = document.createElement("div");
      slot.className = "frame-slot" + (i === activeFrame ? " active-slot" : "");
      slot.dataset.i = i;
      if (IS_CIRCLE) slot.style.borderRadius = "50%";

      var layer = document.createElement("div");
      layer.className = "slot-layer";
      layer.innerHTML = '<img alt="" draggable="false">';
      slot.appendChild(layer);

      // guide overlays
      var grid = document.createElement("div"); grid.className = "slot-grid-overlay";
      var cross = document.createElement("div"); cross.className = "slot-center-cross";
      slot.appendChild(grid); slot.appendChild(cross);

      // corner marks (rect only)
      if (!IS_CIRCLE) {
        var marks = [
          "top:0;left:0;border-width:2px 0 0 2px",
          "top:0;right:0;border-width:2px 2px 0 0",
          "bottom:0;left:0;border-width:0 0 2px 2px",
          "bottom:0;right:0;border-width:0 2px 2px 0"
        ];
        marks.forEach(function (css) {
          var m = document.createElement("div");
          m.className = "slot-corner"; m.style.cssText = css;
          slot.appendChild(m);
        });
      }

      // drop hint
      var hint = document.createElement("div");
      hint.className = "slot-hint";
      hint.innerHTML =
        '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>' +
        '<p>' + (IS_SPLIT ? "Photo " + (i + 1) : "Tap to add a photo") + "<br>or drop it here</p>";
      slot.appendChild(hint);

      // split badge
      if (IS_SPLIT) {
        var badge = document.createElement("div");
        badge.className = "slot-badge"; badge.textContent = i + 1;
        slot.appendChild(badge);
      }

      fo.appendChild(slot);
      setupSlotDrag(slot, i);
    }

    if (IS_SPLIT) {
      var div = document.createElement("div");
      div.className = "frame-divider";
      fo.appendChild(div);
    }
    if (IS_CIRCLE && !IS_SPLIT) {
      var ring = document.createElement("div");
      ring.className = "circle-ring";
      fo.appendChild(ring);
    }
    layoutSlots();
  }

  function slots() { return fo.querySelectorAll(".frame-slot"); }
  function ghosts() { return fo.querySelectorAll(".slot-ghost"); }

  /* ── Position / size slot + ghost boxes (after any resize) ─────────────── */
  function layoutSlots() {
    slots().forEach(function (slot, i) {
      slot.style.left = (i * SLOT_W) + "px";
      slot.style.width = SLOT_W + "px";
      slot.style.height = FH + "px";
    });
    ghosts().forEach(function (g, i) {
      g.style.left = (i * SLOT_W) + "px";
      g.style.width = SLOT_W + "px";
      g.style.height = FH + "px";
    });
    var div = fo.querySelector(".frame-divider");
    if (div) div.style.height = FH + "px";
    // recompute cover-fit baselines for loaded images at the new size
    for (var i = 0; i < QTY; i++) recomputeBaseline(i);
    applyAll();
  }

  /* ── Cover-fit baseline (TRD §7.2) ─────────────────────────────────────── */
  function recomputeBaseline(i) {
    var st = frames[i];
    if (!st.hasImage) return;
    var a = st.natAsp, f = SLOT_W / FH;
    if (a > f) { st.baseH = FH; st.baseW = FH * a; }
    else { st.baseW = SLOT_W; st.baseH = SLOT_W / a; }
  }

  /* ── Apply the display transform to one slot (TRD §7.3) ────────────────── */
  function applyTransform(i) {
    var st = frames[i];
    var slot = slots()[i]; if (!slot) return;
    var layer = slot.querySelector(".slot-layer");
    var ghost = ghosts()[i];
    var bW = st.baseW || SLOT_W, bH = st.baseH || FH;
    var tx = st.offsetX * SLOT_W, ty = st.offsetY * FH;
    var scX = st.scaleW * (st.flipH ? -1 : 1);
    var scY = st.scaleH * (st.flipV ? -1 : 1);
    var tf = "translate(" + tx + "px," + ty + "px) rotate(" + st.rot + "deg) scale(" + scX + "," + scY + ")";

    layer.style.width = bW + "px";
    layer.style.height = bH + "px";
    layer.style.left = (SLOT_W / 2 - bW / 2) + "px";
    layer.style.top = (FH / 2 - bH / 2) + "px";
    layer.style.transform = tf;

    if (ghost) {
      ghost.style.width = bW + "px";
      ghost.style.height = bH + "px";
      ghost.style.left = (i * SLOT_W + SLOT_W / 2 - bW / 2) + "px";
      ghost.style.top = (FH / 2 - bH / 2) + "px";
      ghost.style.transformOrigin = (bW / 2) + "px " + (bH / 2) + "px";
      ghost.style.transform = tf;
      var off = Math.abs(tx) > 4 || Math.abs(ty) > 4 ||
        st.scaleW > 1.05 || st.scaleH > 1.05 || st.rot !== 0;
      ghost.style.opacity = (st.hasImage && off) ? "0.22" : "0";
    }

    slot.querySelector(".slot-hint").style.display = st.hasImage ? "none" : "flex";
  }
  function applyAll() { for (var i = 0; i < QTY; i++) applyTransform(i); }

  /* ── Sync sliders to the active frame ──────────────────────────────────── */
  function syncUI() {
    var st = frames[activeFrame];
    var pxX = Math.round(st.offsetX * SLOT_W), pxY = Math.round(st.offsetY * FH);
    if (Math.abs(pxX) > +sliders.tx.max) { sliders.tx.min = -Math.abs(pxX); sliders.tx.max = Math.abs(pxX); }
    if (Math.abs(pxY) > +sliders.ty.max) { sliders.ty.min = -Math.abs(pxY); sliders.ty.max = Math.abs(pxY); }
    sliders.tx.value = pxX; vals.tx.textContent = pxX + "px";
    sliders.ty.value = pxY; vals.ty.textContent = pxY + "px";
    var pw = Math.round(st.scaleW * 100), ph = Math.round(st.scaleH * 100);
    sliders.sw.value = pw; vals.sw.textContent = pw + "%";
    sliders.sh.value = ph; vals.sh.textContent = ph + "%";
    sliders.rot.value = st.rot; vals.rot.textContent = st.rot + "\u00B0";
    document.getElementById("flip-h").classList.toggle("active", st.flipH);
    document.getElementById("flip-v").classList.toggle("active", st.flipV);
    document.getElementById("link-scale").classList.toggle("active", st.linked);
  }

  /* ── Select active frame (split) ───────────────────────────────────────── */
  function selectFrame(i) {
    activeFrame = i;
    slots().forEach(function (s, idx) { s.classList.toggle("active-slot", idx === i); });
    syncUI();
    updateStatus();
  }

  function updateStatus() {
    var st = frames[activeFrame];
    statusDot.classList.toggle("on", st.hasImage);
    var label = st.hasImage ? (st.imgName || "photo") : "no photo";
    imgNameEl.textContent = IS_SPLIT ? ("Photo " + (activeFrame + 1) + ": " + label) : label;
    refreshUploadMeta();
  }

  /* ── Drag to pan (or tap empty slot to load) ───────────────────────────── */
  function setupSlotDrag(slot, i) {
    var d = { on: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false };
    function start(cx, cy) {
      selectFrame(i);
      if (!frames[i].hasImage) { fileInput.click(); return; }
      d.on = true; d.moved = false; d.sx = cx; d.sy = cy;
      d.ox = frames[i].offsetX * SLOT_W; d.oy = frames[i].offsetY * FH;
    }
    function move(cx, cy) {
      if (!d.on) return;
      d.moved = true;
      frames[i].offsetX = (d.ox + (cx - d.sx)) / SLOT_W;
      frames[i].offsetY = (d.oy + (cy - d.sy)) / FH;
      applyTransform(i);
      if (i === activeFrame) syncUI();
    }
    function end() { d.on = false; }

    slot.addEventListener("mousedown", function (e) { if (e.button === 0) { e.preventDefault(); start(e.clientX, e.clientY); } });
    window.addEventListener("mousemove", function (e) { move(e.clientX, e.clientY); });
    window.addEventListener("mouseup", end);
    slot.addEventListener("touchstart", function (e) { if (e.touches.length === 1) { e.preventDefault(); start(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    window.addEventListener("touchmove", function (e) { if (d.on && e.touches.length === 1) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    window.addEventListener("touchend", end);
  }

  /* ── Load an image into a frame (TRD §11) ──────────────────────────────── */
  function loadImage(file, i) {
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { showToast("Couldn\u2019t read that file. Please use a JPG or PNG.", "error"); };
    reader.onload = function (e) {
      var img = new Image();
      img.onerror = function () {
        // e.g. HEIC that the browser can't decode (TRD §11.2)
        showToast("That image couldn\u2019t be opened. Please use a JPG or PNG.", "error");
      };
      img.onload = function () {
        var st = frames[i];
        st.natAsp = img.naturalWidth / img.naturalHeight || 1;
        st.hasImage = true;
        st.imgSrc = e.target.result;
        var nm = file.name || "photo";
        st.imgName = nm.length > 18 ? nm.slice(0, 16) + "\u2026" : nm;
        // reset placement to cover-fit baseline
        st.offsetX = 0; st.offsetY = 0; st.scaleW = 1; st.scaleH = 1;
        st.rot = 0; st.flipH = false; st.flipV = false;
        recomputeBaseline(i);

        var slot = slots()[i];
        slot.querySelector(".slot-layer img").src = e.target.result;
        var g = ghosts()[i]; if (g) g.querySelector("img").src = e.target.result;

        applyTransform(i);
        if (i === activeFrame) syncUI();
        updateStatus();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  document.getElementById("load-btn").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function (e) {
    if (e.target.files[0]) { loadImage(e.target.files[0], activeFrame); fileInput.value = ""; }
  });
  document.body.addEventListener("dragover", function (e) { e.preventDefault(); });
  document.body.addEventListener("drop", function (e) {
    e.preventDefault();
    if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0], activeFrame);
  });

  /* ── Sliders (act on active frame) ─────────────────────────────────────── */
  sliders.tx.addEventListener("input", function () {
    frames[activeFrame].offsetX = (+sliders.tx.value) / SLOT_W;
    vals.tx.textContent = Math.round(+sliders.tx.value) + "px";
    applyTransform(activeFrame);
  });
  sliders.ty.addEventListener("input", function () {
    frames[activeFrame].offsetY = (+sliders.ty.value) / FH;
    vals.ty.textContent = Math.round(+sliders.ty.value) + "px";
    applyTransform(activeFrame);
  });
  sliders.rot.addEventListener("input", function () {
    frames[activeFrame].rot = +sliders.rot.value;
    vals.rot.textContent = frames[activeFrame].rot + "\u00B0";
    applyTransform(activeFrame);
  });
  sliders.sw.addEventListener("input", function () {
    var st = frames[activeFrame];
    st.scaleW = (+sliders.sw.value) / 100;
    vals.sw.textContent = (+sliders.sw.value) + "%";
    if (st.linked) { st.scaleH = st.scaleW; sliders.sh.value = sliders.sw.value; vals.sh.textContent = sliders.sw.value + "%"; }
    applyTransform(activeFrame);
  });
  sliders.sh.addEventListener("input", function () {
    var st = frames[activeFrame];
    st.scaleH = (+sliders.sh.value) / 100;
    vals.sh.textContent = (+sliders.sh.value) + "%";
    if (st.linked) { st.scaleW = st.scaleH; sliders.sw.value = sliders.sh.value; vals.sw.textContent = sliders.sh.value + "%"; }
    applyTransform(activeFrame);
  });
  document.getElementById("link-scale").addEventListener("click", function () {
    var st = frames[activeFrame];
    st.linked = !st.linked;
    this.classList.toggle("active", st.linked);
    this.setAttribute("aria-pressed", String(st.linked));
    if (st.linked && st.scaleH !== st.scaleW) { st.scaleH = st.scaleW; applyTransform(activeFrame); syncUI(); }
  });

  /* ── Flip ──────────────────────────────────────────────────────────────── */
  document.getElementById("flip-h").addEventListener("click", function () {
    var st = frames[activeFrame]; st.flipH = !st.flipH;
    this.classList.toggle("active", st.flipH); applyTransform(activeFrame);
  });
  document.getElementById("flip-v").addEventListener("click", function () {
    var st = frames[activeFrame]; st.flipV = !st.flipV;
    this.classList.toggle("active", st.flipV); applyTransform(activeFrame);
  });

  /* ── Resets (TRD §7.6) ─────────────────────────────────────────────────── */
  document.getElementById("reset-pos").addEventListener("click", function () {
    var st = frames[activeFrame]; st.offsetX = 0; st.offsetY = 0; applyTransform(activeFrame); syncUI();
  });
  document.getElementById("reset-scale").addEventListener("click", function () {
    var st = frames[activeFrame]; st.scaleW = 1; st.scaleH = 1; applyTransform(activeFrame); syncUI();
  });
  document.getElementById("reset-rot").addEventListener("click", function () {
    frames[activeFrame].rot = 0; applyTransform(activeFrame); syncUI();
  });
  document.getElementById("reset-flip").addEventListener("click", function () {
    var st = frames[activeFrame]; st.flipH = false; st.flipV = false; applyTransform(activeFrame); syncUI();
  });
  document.getElementById("reset-all").addEventListener("click", function () {
    for (var i = 0; i < QTY; i++) {
      var st = frames[i]; st.offsetX = 0; st.offsetY = 0; st.scaleW = 1; st.scaleH = 1;
      st.rot = 0; st.flipH = false; st.flipV = false;
    }
    applyAll(); syncUI();
  });

  /* ── Tabs ──────────────────────────────────────────────────────────────── */
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.panel).classList.add("active");
      if (btn.dataset.panel === "upload") refreshUploadMeta();
    });
  });

  /* ── Guides ────────────────────────────────────────────────────────────── */
  var gridOn = false, crossOn = false;
  document.getElementById("gb-grid").addEventListener("click", function () {
    gridOn = !gridOn; this.classList.toggle("active", gridOn);
    fo.querySelectorAll(".slot-grid-overlay").forEach(function (el) { el.classList.toggle("visible", gridOn); });
  });
  document.getElementById("gb-cross").addEventListener("click", function () {
    crossOn = !crossOn; this.classList.toggle("active", crossOn);
    fo.querySelectorAll(".slot-center-cross").forEach(function (el) { el.classList.toggle("visible", crossOn); });
  });

  /* ── Export pixel sizes (TRD §7.4) ─────────────────────────────────────── */
  function pxPerMm() { return DPI / MM_PER_INCH; }
  function slotExpW() { return Math.round(SLOT_W_MM * pxPerMm()); }
  function slotExpH() { return Math.round(FRAME_H_MM * pxPerMm()); }
  function canvasW() { return slotExpW() * QTY; }
  function canvasH() { return slotExpH(); }

  function refreshUploadMeta() {
    var pxEl = document.getElementById("meta-px");
    var imEl = document.getElementById("meta-imgs");
    if (pxEl) pxEl.textContent = canvasW() + " \u00D7 " + canvasH() + " px";
    if (imEl) {
      var loaded = frames.slice(0, QTY).filter(function (s) { return s.hasImage; }).length;
      imEl.textContent = loaded + " / " + QTY + " loaded";
      imEl.classList.toggle("warn", loaded < QTY);
    }
  }

  /* ── Render the print-ready canvas (TRD §7.4) ──────────────────────────── */
  async function renderCanvas() {
    var SEW = slotExpW(), SEH = slotExpH();
    var canvas = document.getElementById("export-canvas");
    canvas.width = SEW * QTY;
    canvas.height = SEH;
    var ctx = canvas.getContext("2d");

    // Opaque white base layer (locked white-background decision, TRD §7.4)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < QTY; i++) {
      var st = frames[i];
      var rX = SEW / SLOT_W, rY = SEH / FH;
      var xOff = i * SEW;

      var img = new Image();
      img.src = st.imgSrc;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(function (res) { if (img.complete) res(); else img.onload = res; });

      ctx.save();
      ctx.beginPath();
      ctx.rect(xOff, 0, SEW, SEH);
      ctx.clip();
      ctx.translate(xOff + SEW / 2, SEH / 2);
      ctx.translate(st.offsetX * SEW, st.offsetY * SEH); // normalised offset into export space
      ctx.rotate(st.rot * Math.PI / 180);
      ctx.scale(st.scaleW * (st.flipH ? -1 : 1), st.scaleH * (st.flipV ? -1 : 1));
      var bW = st.baseW * rX, bH = st.baseH * rY;
      ctx.drawImage(img, -bW / 2, -bH / 2, bW, bH);
      ctx.restore();
    }
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, "image/png"); });
  }

  /* ── Mobile validation & normalisation (TRD §10) ───────────────────────── */
  function normalizeMobile(raw) {
    var cleaned = String(raw).replace(/[\s\-()]/g, "");
    if (!/^(?:\+?91|0091|0)?[6-9]\d{9}$/.test(cleaned)) return null;
    return cleaned.replace(/^(?:\+?91|0091|0)/, "");
  }
  function slugifyName(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function timestamp() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" +
      p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  /* ── Customer-details modal (TRD §8) ───────────────────────────────────── */
  var overlay = document.getElementById("details-overlay");
  var nameInput = document.getElementById("cust-name");
  var mobileInput = document.getElementById("cust-mobile");
  var nameErr = document.getElementById("name-err");
  var mobileErr = document.getElementById("mobile-err");
  var confirmBtn = document.getElementById("details-confirm");

  function validateDetails(showErrors) {
    var nameOk = nameInput.value.trim().length > 0;
    var normalized = normalizeMobile(mobileInput.value);
    var mobileOk = normalized !== null;
    if (showErrors) {
      nameInput.classList.toggle("invalid", !nameOk);
      mobileInput.classList.toggle("invalid", !mobileOk);
      nameErr.textContent = nameOk ? "" : "Please enter your name.";
      mobileErr.textContent = mobileOk ? "" : "Enter a valid 10-digit Indian mobile number.";
    }
    confirmBtn.disabled = !(nameOk && mobileOk);
    return nameOk && mobileOk ? { name: nameInput.value.trim(), mobile: normalized } : null;
  }
  nameInput.addEventListener("input", function () { nameInput.classList.remove("invalid"); nameErr.textContent = ""; validateDetails(false); });
  mobileInput.addEventListener("input", function () { mobileInput.classList.remove("invalid"); mobileErr.textContent = ""; validateDetails(false); });

  function openModal() {
    overlay.classList.add("show");
    validateDetails(false);
    setTimeout(function () { nameInput.focus(); }, 50);
  }
  function closeModal() { overlay.classList.remove("show"); }
  document.getElementById("details-cancel").addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });

  /* ── Upload flow (TRD §9, §12, §14) ────────────────────────────────────── */
  document.getElementById("upload-btn").addEventListener("click", function () {
    if (!ENDPOINT) { showToast("No upload endpoint is configured.", "error"); return; }
    if (!/^https:\/\//i.test(ENDPOINT)) { showToast("Upload endpoint must be an https:// URL.", "error"); return; }
    var missing = frames.slice(0, QTY).some(function (s) { return !s.hasImage; });
    if (missing) {
      showToast(IS_SPLIT ? "Add a photo to both frames first." : "Add a photo first.", "error");
      return;
    }
    openModal(); // gate: details required before upload can proceed
  });

  confirmBtn.addEventListener("click", async function () {
    var details = validateDetails(true);
    if (!details) return;
    closeModal();

    var btn = document.getElementById("upload-btn");
    btn.disabled = true;
    var prevLabel = btn.textContent;
    btn.textContent = "Uploading\u2026";
    showToast("Uploading your print file\u2026", "loading", 0);

    try {
      var blob = await renderCanvas();
      var fileName = slugifyName(details.name) + "_" + details.mobile + "_" +
        product.slug + "_" + timestamp() + ".png";

      var fd = new FormData();
      fd.append("file", blob, fileName);
      fd.append("product_slug", product.slug);
      fd.append("product_name", product.name);
      fd.append("shape", product.shape);
      fd.append("quantity", String(QTY));
      if (IS_CIRCLE) {
        fd.append("diameter_mm", String(product.diameterMm));
      } else {
        fd.append("width_mm", String(FRAME_W_MM));
        fd.append("height_mm", String(FRAME_H_MM));
      }
      fd.append("px_width", String(canvasW()));
      fd.append("px_height", String(canvasH()));
      fd.append("dpi", String(DPI));
      fd.append("customer_name", details.name);
      fd.append("customer_mobile", details.mobile);

      // Simple CORS request: no custom headers, browser sets multipart Content-Type (TRD §9.1, §14.2)
      var res = await fetch(ENDPOINT, { method: "POST", body: fd });
      if (res.status === 200) {
        showToast("Uploaded. We\u2019ll get printing \u2014 thanks!", "success");
      } else {
        showToast("Upload failed (server responded " + res.status + "). Try again.", "error");
      }
    } catch (err) {
      var m = (err && err.message) || "";
      showToast(/fetch|network|Failed/i.test(m) ? "Couldn\u2019t reach the server. Try again." : "Upload failed. Try again.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  });

  /* ── Toast ─────────────────────────────────────────────────────────────── */
  var TOAST_IC = { success: "\u2713", error: "\u2715", loading: "\u22EF", default: "" };
  var toastTimer;
  function showToast(msg, type, duration) {
    type = type || "default";
    duration = duration === undefined ? 3200 : duration;
    clearTimeout(toastTimer);
    toastEl.className = "show" + (type !== "default" ? " " + type : "");
    toastIc.textContent = TOAST_IC[type] || "";
    toastMsg.textContent = msg;
    if (duration > 0) toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, duration);
  }

  /* ── Header spec badge ─────────────────────────────────────────────────── */
  (function setHeader() {
    document.getElementById("top-name").textContent = product.name +
      (product.subtitle ? " \u00B7 " + product.subtitle : "");
    var spec = IS_CIRCLE
      ? "\u2300 " + product.diameterMm + " mm"
      : FRAME_W_MM + " \u00D7 " + FRAME_H_MM + " mm";
    if (IS_SPLIT) spec += " \u00B7 2 photos";
    document.getElementById("top-spec").textContent = spec;
    document.title = "Pix2Prints — " + product.name;
  })();

  /* ── Init ──────────────────────────────────────────────────────────────── */
  computeFramePx();
  buildFrames();
  selectFrame(0);
  syncUI();
  refreshUploadMeta();

  var resizeRaf;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(function () { computeFramePx(); layoutSlots(); syncUI(); });
  });
})();
