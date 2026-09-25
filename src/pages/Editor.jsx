import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CONFIG from '../config.js'
import './Editor.css'

export default function Editor() {
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug')
  const product = (CONFIG.products || []).find((p) => p.slug === slug)
  const rootRef = useRef(null)

  /* ═══════════════════════════════════════════════════════════════════════
     Frame-fit editor engine — ported from the original editor.js almost
     verbatim (same coordinate model, same DPI export, same upload flow).
     It talks to the DOM directly (refs/ids) rather than through React state
     because the drag/scale/rotate interactions and the 300-DPI canvas
     export are perf-sensitive and were already correct as plain DOM code.
     An AbortController removes every listener this effect adds when the
     product changes or the page is left (React Router keeps the app alive
     as a single page, unlike the original multi-page site).
     ═══════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!product) return undefined

    const controller = new AbortController()
    const { signal } = controller

    const CFG = CONFIG || {}
    const MM_PER_INCH = 25.4
    const DPI = (CFG.app && CFG.app.dpi) || 300
    const ENDPOINT = (CFG.app && CFG.app.uploadEndpoint) || ''

    /* ── Derive geometry from config ─────────────────────────────────────── */
    const IS_CIRCLE = product.shape === 'circle'
    const PHOTO_COUNT = (product.shape === 'rect' && product.quantity === 2) ? 2 : 1
    const IS_TWO_SIDED = PHOTO_COUNT === 2
    const SIDE_LABELS = ['Front', 'Back']
    const FRAME_W_MM = IS_CIRCLE ? product.diameterMm : product.widthMm
    const FRAME_H_MM = IS_CIRCLE ? product.diameterMm : product.heightMm
    const SLOT_W_MM = FRAME_W_MM / PHOTO_COUNT

    /* ── Per-frame placement state (normalised) ──────────────────────────── */
    function newState() {
      return {
        offsetX: 0, offsetY: 0,
        scaleW: 1, scaleH: 1,
        rot: 0, flipH: false, flipV: false, linked: true,
        hasImage: false, imgSrc: '', imgName: '',
        baseW: 0, baseH: 0,
        natAsp: 1
      }
    }
    const frames = [newState(), newState()]
    let activeFrame = 0

    /* ── DOM refs ─────────────────────────────────────────────────────────── */
    const fo = document.getElementById('frame-outer')
    const fileInput = document.getElementById('file-input')
    const statusDot = document.getElementById('status-dot')
    const imgNameEl = document.getElementById('img-name')
    const toastEl = document.getElementById('toast')
    const toastIc = document.getElementById('toast-ic')
    const toastMsg = document.getElementById('toast-msg')

    const sliders = {
      tx: document.getElementById('tx'), ty: document.getElementById('ty'),
      sw: document.getElementById('sw'), sh: document.getElementById('sh'),
      rot: document.getElementById('rot')
    }
    const vals = {
      tx: document.getElementById('tx-val'), ty: document.getElementById('ty-val'),
      sw: document.getElementById('sw-val'), sh: document.getElementById('sh-val'),
      rot: document.getElementById('rot-val')
    }

    /* ── Frame pixel sizing (fit into the stage well) ────────────────────── */
    let FW = 300, FH = 300, SLOT_W = 300
    function computeFramePx() {
      const well = document.getElementById('well')
      const pad = 20
      const availW = well.clientWidth - pad * 2
      const availH = well.clientHeight - pad * 2
      const aspect = FRAME_W_MM / FRAME_H_MM
      let fw, fh
      if (availW / availH > aspect) { fh = availH; fw = Math.round(fh * aspect) }
      else { fw = availW; fh = Math.round(fw / aspect) }
      FW = fw; FH = fh; SLOT_W = IS_TWO_SIDED ? Math.round(fw / 2) : fw
      fo.style.width = fw + 'px'
      fo.style.height = fh + 'px'
    }

    /* ── Build slot DOM ───────────────────────────────────────────────────── */
    function buildFrames() {
      fo.innerHTML = ''
      for (let i = 0; i < PHOTO_COUNT; i++) {
        const ghost = document.createElement('div')
        ghost.className = 'slot-ghost'
        ghost.innerHTML = '<img alt="" draggable="false">'
        fo.appendChild(ghost)

        const slot = document.createElement('div')
        slot.className = 'frame-slot' + (i === activeFrame ? ' active-slot' : '')
        slot.dataset.i = i
        if (IS_CIRCLE) slot.style.borderRadius = '50%'

        const layer = document.createElement('div')
        layer.className = 'slot-layer'
        layer.innerHTML = '<img alt="" draggable="false">'
        slot.appendChild(layer)

        const grid = document.createElement('div'); grid.className = 'slot-grid-overlay'
        const cross = document.createElement('div'); cross.className = 'slot-center-cross'
        slot.appendChild(grid); slot.appendChild(cross)

        if (!IS_CIRCLE) {
          const marks = [
            'top:0;left:0;border-width:2px 0 0 2px',
            'top:0;right:0;border-width:2px 2px 0 0',
            'bottom:0;left:0;border-width:0 0 2px 2px',
            'bottom:0;right:0;border-width:0 2px 2px 0'
          ]
          marks.forEach((css) => {
            const m = document.createElement('div')
            m.className = 'slot-corner'; m.style.cssText = css
            slot.appendChild(m)
          })
        }

        const hint = document.createElement('div')
        hint.className = 'slot-hint'
        hint.innerHTML =
          '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>' +
          '<p>' + (IS_TWO_SIDED ? SIDE_LABELS[i] : 'Tap to add a photo') + '<br>or drop it here</p>'
        slot.appendChild(hint)

        if (IS_TWO_SIDED) {
          const badge = document.createElement('div')
          badge.className = 'slot-badge'; badge.textContent = String(i + 1)
          slot.appendChild(badge)
        }

        fo.appendChild(slot)
        setupSlotDrag(slot, i)
      }

      if (IS_TWO_SIDED) {
        const div = document.createElement('div')
        div.className = 'frame-divider'
        fo.appendChild(div)
      }
      if (IS_CIRCLE && !IS_TWO_SIDED) {
        const ring = document.createElement('div')
        ring.className = 'circle-ring'
        fo.appendChild(ring)
      }
      layoutSlots()
    }

    function slots() { return fo.querySelectorAll('.frame-slot') }
    function ghosts() { return fo.querySelectorAll('.slot-ghost') }

    /* ── Position / size slot + ghost boxes (after any resize) ──────────── */
    function layoutSlots() {
      slots().forEach((slot, i) => {
        slot.style.left = (i * SLOT_W) + 'px'
        slot.style.width = SLOT_W + 'px'
        slot.style.height = FH + 'px'
      })
      ghosts().forEach((g, i) => {
        g.style.left = (i * SLOT_W) + 'px'
        g.style.width = SLOT_W + 'px'
        g.style.height = FH + 'px'
      })
      const div = fo.querySelector('.frame-divider')
      if (div) div.style.height = FH + 'px'
      for (let i = 0; i < PHOTO_COUNT; i++) recomputeBaseline(i)
      applyAll()
    }

    /* ── Cover-fit baseline ───────────────────────────────────────────────── */
    function recomputeBaseline(i) {
      const st = frames[i]
      if (!st.hasImage) return
      const a = st.natAsp, f = SLOT_W / FH
      if (a > f) { st.baseH = FH; st.baseW = FH * a }
      else { st.baseW = SLOT_W; st.baseH = SLOT_W / a }
    }

    /* ── Apply the display transform to one slot ─────────────────────────── */
    function applyTransform(i) {
      const st = frames[i]
      const slot = slots()[i]; if (!slot) return
      const layer = slot.querySelector('.slot-layer')
      const ghost = ghosts()[i]
      const bW = st.baseW || SLOT_W, bH = st.baseH || FH
      const tx = st.offsetX * SLOT_W, ty = st.offsetY * FH
      const scX = st.scaleW * (st.flipH ? -1 : 1)
      const scY = st.scaleH * (st.flipV ? -1 : 1)
      const tf = 'translate(' + tx + 'px,' + ty + 'px) rotate(' + st.rot + 'deg) scale(' + scX + ',' + scY + ')'

      layer.style.width = bW + 'px'
      layer.style.height = bH + 'px'
      layer.style.left = (SLOT_W / 2 - bW / 2) + 'px'
      layer.style.top = (FH / 2 - bH / 2) + 'px'
      layer.style.transform = tf

      if (ghost) {
        ghost.style.width = bW + 'px'
        ghost.style.height = bH + 'px'
        ghost.style.left = (i * SLOT_W + SLOT_W / 2 - bW / 2) + 'px'
        ghost.style.top = (FH / 2 - bH / 2) + 'px'
        ghost.style.transformOrigin = (bW / 2) + 'px ' + (bH / 2) + 'px'
        ghost.style.transform = tf
        const off = Math.abs(tx) > 4 || Math.abs(ty) > 4 ||
          st.scaleW > 1.05 || st.scaleH > 1.05 || st.rot !== 0
        ghost.style.opacity = (st.hasImage && off) ? '0.22' : '0'
      }

      slot.querySelector('.slot-hint').style.display = st.hasImage ? 'none' : 'flex'
    }
    function applyAll() { for (let i = 0; i < PHOTO_COUNT; i++) applyTransform(i) }

    /* ── Sync sliders to the active frame ────────────────────────────────── */
    function syncUI() {
      const st = frames[activeFrame]
      const pxX = Math.round(st.offsetX * SLOT_W), pxY = Math.round(st.offsetY * FH)
      if (Math.abs(pxX) > +sliders.tx.max) { sliders.tx.min = -Math.abs(pxX); sliders.tx.max = Math.abs(pxX) }
      if (Math.abs(pxY) > +sliders.ty.max) { sliders.ty.min = -Math.abs(pxY); sliders.ty.max = Math.abs(pxY) }
      sliders.tx.value = pxX; vals.tx.textContent = pxX + 'px'
      sliders.ty.value = pxY; vals.ty.textContent = pxY + 'px'
      const pw = Math.round(st.scaleW * 100), ph = Math.round(st.scaleH * 100)
      sliders.sw.value = pw; vals.sw.textContent = pw + '%'
      sliders.sh.value = ph; vals.sh.textContent = ph + '%'
      sliders.rot.value = st.rot; vals.rot.textContent = st.rot + '°'
      document.getElementById('flip-h').classList.toggle('active', st.flipH)
      document.getElementById('flip-v').classList.toggle('active', st.flipV)
      document.getElementById('link-scale').classList.toggle('active', st.linked)
    }

    /* ── Select active frame (front/back) ────────────────────────────────── */
    function selectFrame(i) {
      activeFrame = i
      slots().forEach((s, idx) => { s.classList.toggle('active-slot', idx === i) })
      syncUI()
      updateStatus()
    }

    function updateStatus() {
      const st = frames[activeFrame]
      statusDot.classList.toggle('on', st.hasImage)
      const label = st.hasImage ? (st.imgName || 'photo') : 'no photo'
      imgNameEl.textContent = IS_TWO_SIDED ? (SIDE_LABELS[activeFrame] + ': ' + label) : label
      refreshUploadMeta()
    }

    /* ── Drag to pan (or tap empty slot to load) ─────────────────────────── */
    function setupSlotDrag(slot, i) {
      const d = { on: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false }
      function start(cx, cy) {
        selectFrame(i)
        if (!frames[i].hasImage) { fileInput.click(); return }
        d.on = true; d.moved = false; d.sx = cx; d.sy = cy
        d.ox = frames[i].offsetX * SLOT_W; d.oy = frames[i].offsetY * FH
      }
      function move(cx, cy) {
        if (!d.on) return
        d.moved = true
        frames[i].offsetX = (d.ox + (cx - d.sx)) / SLOT_W
        frames[i].offsetY = (d.oy + (cy - d.sy)) / FH
        applyTransform(i)
        if (i === activeFrame) syncUI()
      }
      function end() { d.on = false }

      slot.addEventListener('mousedown', (e) => { if (e.button === 0) { e.preventDefault(); start(e.clientX, e.clientY) } }, { signal })
      window.addEventListener('mousemove', (e) => { move(e.clientX, e.clientY) }, { signal })
      window.addEventListener('mouseup', end, { signal })
      slot.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { e.preventDefault(); start(e.touches[0].clientX, e.touches[0].clientY) } }, { passive: false, signal })
      window.addEventListener('touchmove', (e) => { if (d.on && e.touches.length === 1) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY) } }, { passive: false, signal })
      window.addEventListener('touchend', end, { signal })
    }

    /* ── Load an image into a frame ──────────────────────────────────────── */
    function loadImage(file, i) {
      if (!file) return
      const reader = new FileReader()
      reader.onerror = () => { showToast('Couldn’t read that file. Please use a JPG or PNG.', 'error') }
      reader.onload = (e) => {
        const img = new Image()
        img.onerror = () => {
          showToast('That image couldn’t be opened. Please use a JPG or PNG.', 'error')
        }
        img.onload = () => {
          const st = frames[i]
          st.natAsp = img.naturalWidth / img.naturalHeight || 1
          st.hasImage = true
          st.imgSrc = e.target.result
          const nm = file.name || 'photo'
          st.imgName = nm.length > 18 ? nm.slice(0, 16) + '…' : nm
          st.offsetX = 0; st.offsetY = 0; st.scaleW = 1; st.scaleH = 1
          st.rot = 0; st.flipH = false; st.flipV = false
          recomputeBaseline(i)

          const slot = slots()[i]
          slot.querySelector('.slot-layer img').src = e.target.result
          const g = ghosts()[i]; if (g) g.querySelector('img').src = e.target.result

          applyTransform(i)
          if (i === activeFrame) syncUI()
          updateStatus()
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }

    document.getElementById('load-btn').addEventListener('click', () => { fileInput.click() }, { signal })
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) { loadImage(e.target.files[0], activeFrame); fileInput.value = '' }
    }, { signal })
    document.body.addEventListener('dragover', (e) => { e.preventDefault() }, { signal })
    document.body.addEventListener('drop', (e) => {
      e.preventDefault()
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0], activeFrame)
    }, { signal })

    /* ── Sliders (act on active frame) ───────────────────────────────────── */
    sliders.tx.addEventListener('input', () => {
      frames[activeFrame].offsetX = (+sliders.tx.value) / SLOT_W
      vals.tx.textContent = Math.round(+sliders.tx.value) + 'px'
      applyTransform(activeFrame)
    }, { signal })
    sliders.ty.addEventListener('input', () => {
      frames[activeFrame].offsetY = (+sliders.ty.value) / FH
      vals.ty.textContent = Math.round(+sliders.ty.value) + 'px'
      applyTransform(activeFrame)
    }, { signal })
    sliders.rot.addEventListener('input', () => {
      frames[activeFrame].rot = +sliders.rot.value
      vals.rot.textContent = frames[activeFrame].rot + '°'
      applyTransform(activeFrame)
    }, { signal })
    sliders.sw.addEventListener('input', () => {
      const st = frames[activeFrame]
      st.scaleW = (+sliders.sw.value) / 100
      vals.sw.textContent = (+sliders.sw.value) + '%'
      if (st.linked) { st.scaleH = st.scaleW; sliders.sh.value = sliders.sw.value; vals.sh.textContent = sliders.sw.value + '%' }
      applyTransform(activeFrame)
    }, { signal })
    sliders.sh.addEventListener('input', () => {
      const st = frames[activeFrame]
      st.scaleH = (+sliders.sh.value) / 100
      vals.sh.textContent = (+sliders.sh.value) + '%'
      if (st.linked) { st.scaleW = st.scaleH; sliders.sw.value = sliders.sh.value; vals.sw.textContent = sliders.sh.value + '%' }
      applyTransform(activeFrame)
    }, { signal })
    document.getElementById('link-scale').addEventListener('click', function () {
      const st = frames[activeFrame]
      st.linked = !st.linked
      this.classList.toggle('active', st.linked)
      this.setAttribute('aria-pressed', String(st.linked))
      if (st.linked && st.scaleH !== st.scaleW) { st.scaleH = st.scaleW; applyTransform(activeFrame); syncUI() }
    }, { signal })

    /* ── Flip ─────────────────────────────────────────────────────────────── */
    document.getElementById('flip-h').addEventListener('click', function () {
      const st = frames[activeFrame]; st.flipH = !st.flipH
      this.classList.toggle('active', st.flipH); applyTransform(activeFrame)
    }, { signal })
    document.getElementById('flip-v').addEventListener('click', function () {
      const st = frames[activeFrame]; st.flipV = !st.flipV
      this.classList.toggle('active', st.flipV); applyTransform(activeFrame)
    }, { signal })

    /* ── Resets ───────────────────────────────────────────────────────────── */
    document.getElementById('reset-pos').addEventListener('click', () => {
      const st = frames[activeFrame]; st.offsetX = 0; st.offsetY = 0; applyTransform(activeFrame); syncUI()
    }, { signal })
    document.getElementById('reset-scale').addEventListener('click', () => {
      const st = frames[activeFrame]; st.scaleW = 1; st.scaleH = 1; applyTransform(activeFrame); syncUI()
    }, { signal })
    document.getElementById('reset-rot').addEventListener('click', () => {
      frames[activeFrame].rot = 0; applyTransform(activeFrame); syncUI()
    }, { signal })
    document.getElementById('reset-flip').addEventListener('click', () => {
      const st = frames[activeFrame]; st.flipH = false; st.flipV = false; applyTransform(activeFrame); syncUI()
    }, { signal })
    document.getElementById('reset-all').addEventListener('click', () => {
      for (let i = 0; i < PHOTO_COUNT; i++) {
        const st = frames[i]; st.offsetX = 0; st.offsetY = 0; st.scaleW = 1; st.scaleH = 1
        st.rot = 0; st.flipH = false; st.flipV = false
      }
      applyAll(); syncUI()
    }, { signal })

    /* ── Tabs ─────────────────────────────────────────────────────────────── */
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => { b.classList.remove('active') })
        document.querySelectorAll('.panel').forEach((p) => { p.classList.remove('active') })
        btn.classList.add('active')
        document.getElementById('panel-' + btn.dataset.panel).classList.add('active')
        if (btn.dataset.panel === 'upload') refreshUploadMeta()
      }, { signal })
    })

    /* ── Guides ───────────────────────────────────────────────────────────── */
    let gridOn = false, crossOn = false
    document.getElementById('gb-grid').addEventListener('click', function () {
      gridOn = !gridOn; this.classList.toggle('active', gridOn)
      fo.querySelectorAll('.slot-grid-overlay').forEach((el) => { el.classList.toggle('visible', gridOn) })
    }, { signal })
    document.getElementById('gb-cross').addEventListener('click', function () {
      crossOn = !crossOn; this.classList.toggle('active', crossOn)
      fo.querySelectorAll('.slot-center-cross').forEach((el) => { el.classList.toggle('visible', crossOn) })
    }, { signal })

    /* ── Export pixel sizes ──────────────────────────────────────────────── */
    function pxPerMm() { return DPI / MM_PER_INCH }
    function slotExpW() { return Math.round(SLOT_W_MM * pxPerMm()) }
    function slotExpH() { return Math.round(FRAME_H_MM * pxPerMm()) }
    function canvasW() { return slotExpW() * PHOTO_COUNT }
    function canvasH() { return slotExpH() }

    function refreshUploadMeta() {
      const pxEl = document.getElementById('meta-px')
      const imEl = document.getElementById('meta-imgs')
      if (pxEl) pxEl.textContent = canvasW() + ' × ' + canvasH() + ' px'
      if (imEl) {
        const loaded = frames.slice(0, PHOTO_COUNT).filter((s) => s.hasImage).length
        imEl.textContent = loaded + ' / ' + PHOTO_COUNT + ' loaded'
        imEl.classList.toggle('warn', loaded < PHOTO_COUNT)
      }
    }

    /* ── Render the print-ready canvas ───────────────────────────────────── */
    async function renderCanvas() {
      const SEW = slotExpW(), SEH = slotExpH()
      const canvas = document.getElementById('export-canvas')
      canvas.width = SEW * PHOTO_COUNT
      canvas.height = SEH
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < PHOTO_COUNT; i++) {
        const st = frames[i]
        const rX = SEW / SLOT_W, rY = SEH / FH
        const xOff = i * SEW

        const img = new Image()
        img.src = st.imgSrc
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => { if (img.complete) res(); else img.onload = res })

        ctx.save()
        ctx.beginPath()
        ctx.rect(xOff, 0, SEW, SEH)
        ctx.clip()
        ctx.translate(xOff + SEW / 2, SEH / 2)
        ctx.translate(st.offsetX * SEW, st.offsetY * SEH)
        ctx.rotate(st.rot * Math.PI / 180)
        ctx.scale(st.scaleW * (st.flipH ? -1 : 1), st.scaleH * (st.flipV ? -1 : 1))
        const bW = st.baseW * rX, bH = st.baseH * rY
        ctx.drawImage(img, -bW / 2, -bH / 2, bW, bH)
        ctx.restore()
      }
      return new Promise((res) => { canvas.toBlob((b) => { res(b) }, 'image/png') })
    }

    /* ── Mobile validation & normalisation ───────────────────────────────── */
    function normalizeMobile(raw) {
      const cleaned = String(raw).replace(/[\s\-()]/g, '')
      if (!/^(?:\+?91|0091|0)?[6-9]\d{9}$/.test(cleaned)) return null
      return cleaned.replace(/^(?:\+?91|0091|0)/, '')
    }
    function slugifyName(name) {
      return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }
    function timestamp() {
      const d = new Date(), p = (n) => String(n).padStart(2, '0')
      return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
        p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
    }

    /* ── Customer-details modal ──────────────────────────────────────────── */
    const overlay = document.getElementById('details-overlay')
    const nameInput = document.getElementById('cust-name')
    const mobileInput = document.getElementById('cust-mobile')
    const nameErr = document.getElementById('name-err')
    const mobileErr = document.getElementById('mobile-err')
    const confirmBtn = document.getElementById('details-confirm')

    function validateDetails(showErrors) {
      const nameOk = nameInput.value.trim().length > 0
      const normalized = normalizeMobile(mobileInput.value)
      const mobileOk = normalized !== null
      if (showErrors) {
        nameInput.classList.toggle('invalid', !nameOk)
        mobileInput.classList.toggle('invalid', !mobileOk)
        nameErr.textContent = nameOk ? '' : 'Please enter your name.'
        mobileErr.textContent = mobileOk ? '' : 'Enter a valid 10-digit Indian mobile number.'
      }
      confirmBtn.disabled = !(nameOk && mobileOk)
      return nameOk && mobileOk ? { name: nameInput.value.trim(), mobile: normalized } : null
    }
    nameInput.addEventListener('input', () => { nameInput.classList.remove('invalid'); nameErr.textContent = ''; validateDetails(false) }, { signal })
    mobileInput.addEventListener('input', () => { mobileInput.classList.remove('invalid'); mobileErr.textContent = ''; validateDetails(false) }, { signal })

    function openModal() {
      overlay.classList.add('show')
      validateDetails(false)
      setTimeout(() => { nameInput.focus() }, 50)
    }
    function closeModal() { overlay.classList.remove('show') }
    document.getElementById('details-cancel').addEventListener('click', closeModal, { signal })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal() }, { signal })

    /* ── Upload flow ──────────────────────────────────────────────────────── */
    document.getElementById('upload-btn').addEventListener('click', () => {
      if (!ENDPOINT) { showToast('No upload endpoint is configured.', 'error'); return }
      if (!/^https:\/\//i.test(ENDPOINT)) { showToast('Upload endpoint must be an https:// URL.', 'error'); return }
      const missing = frames.slice(0, PHOTO_COUNT).some((s) => !s.hasImage)
      if (missing) {
        showToast(IS_TWO_SIDED ? 'Add a photo to both front and back first.' : 'Add a photo first.', 'error')
        return
      }
      openModal()
    }, { signal })

    confirmBtn.addEventListener('click', async () => {
      const details = validateDetails(true)
      if (!details) return
      closeModal()

      const btn = document.getElementById('upload-btn')
      btn.disabled = true
      const prevLabel = btn.textContent
      btn.textContent = 'Uploading…'
      showToast('Uploading your print file…', 'loading', 0)

      try {
        const blob = await renderCanvas()
        const fileName = slugifyName(details.name) + '_' + details.mobile + '_' +
          product.slug + '_' + timestamp() + '.png'

        const fd = new FormData()
        fd.append('file', blob, fileName)
        fd.append('product_slug', product.slug)
        fd.append('product_name', product.name)
        fd.append('shape', product.shape)
        fd.append('quantity', String(PHOTO_COUNT))
        if (IS_CIRCLE) {
          fd.append('diameter_mm', String(product.diameterMm))
        } else {
          fd.append('width_mm', String(FRAME_W_MM))
          fd.append('height_mm', String(FRAME_H_MM))
        }
        fd.append('px_width', String(canvasW()))
        fd.append('px_height', String(canvasH()))
        fd.append('dpi', String(DPI))
        fd.append('customer_name', details.name)
        fd.append('customer_mobile', details.mobile)

        const res = await fetch(ENDPOINT, { method: 'POST', body: fd })
        if (res.status === 200) {
          showToast('Uploaded. We’ll get printing — thanks!', 'success')
        } else {
          showToast('Upload failed (server responded ' + res.status + '). Try again.', 'error')
        }
      } catch (err) {
        const m = (err && err.message) || ''
        showToast(/fetch|network|Failed/i.test(m) ? 'Couldn’t reach the server. Try again.' : 'Upload failed. Try again.', 'error')
      } finally {
        btn.disabled = false
        btn.textContent = prevLabel
      }
    }, { signal })

    /* ── Toast ────────────────────────────────────────────────────────────── */
    const TOAST_IC = { success: '✓', error: '✕', loading: '⋯', default: '' }
    let toastTimer
    function showToast(msg, type, duration) {
      type = type || 'default'
      duration = duration === undefined ? 3200 : duration
      clearTimeout(toastTimer)
      toastEl.className = 'show' + (type !== 'default' ? ' ' + type : '')
      toastIc.textContent = TOAST_IC[type] || ''
      toastMsg.textContent = msg
      if (duration > 0) toastTimer = setTimeout(() => { toastEl.classList.remove('show') }, duration)
    }

    document.title = 'Pix2Prints — ' + product.name

    /* ── Init ─────────────────────────────────────────────────────────────── */
    computeFramePx()
    buildFrames()
    selectFrame(0)
    syncUI()
    refreshUploadMeta()

    let resizeRaf
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(() => { computeFramePx(); layoutSlots(); syncUI() })
    }, { signal })

    return () => {
      controller.abort()
      cancelAnimationFrame(resizeRaf)
      clearTimeout(toastTimer)
    }
  }, [product])

  if (!product) {
    return (
      <div className="editor-page">
        <div id="notfound">
          <div className="nf-card">
            <div className="mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" /></svg>
            </div>
            <h2>Product not found</h2>
            <p>
              {slug
                ? `We couldn't find a product for "${slug}". It may have been renamed or removed.`
                : 'No product was specified. Head back to the catalog to pick one.'}
            </p>
            <Link to="/">Back to catalog</Link>
          </div>
        </div>
      </div>
    )
  }

  const isCircle = product.shape === 'circle'
  const frameWmm = isCircle ? product.diameterMm : product.widthMm
  const frameHmm = isCircle ? product.diameterMm : product.heightMm
  const isTwoSided = product.shape === 'rect' && product.quantity === 2
  let specStr = isCircle ? `⌀ ${product.diameterMm} mm` : `${frameWmm} × ${frameHmm} mm`
  if (isTwoSided) specStr += ' · 2 photos'

  return (
    <div className="editor-page" ref={rootRef}>
      <div id="app">

        {/* Top bar */}
        <div id="topbar">
          <Link className="icon-btn" to="/" aria-label="Back to catalog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </Link>
          <div className="top-title">
            <div className="name" id="top-name">{product.name}{product.subtitle ? ` · ${product.subtitle}` : ''}</div>
            <div className="spec" id="top-spec">{specStr}</div>
          </div>
          <button id="load-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Photo
          </button>
        </div>

        {/* Canvas zone */}
        <div id="canvas-zone">
          <div id="guide-bar">
            <button className="guide-btn" id="gb-grid" type="button">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x=".75" y=".75" width="12.5" height="12.5" rx="1" /><line x1="4.67" y1=".75" x2="4.67" y2="13.25" /><line x1="9.33" y1=".75" x2="9.33" y2="13.25" /><line x1=".75" y1="4.67" x2="13.25" y2="4.67" /><line x1=".75" y1="9.33" x2="13.25" y2="9.33" /></svg>
              Grid
            </button>
            <button className="guide-btn" id="gb-cross" type="button">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /><circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" /></svg>
              Center
            </button>
            <span className="guide-spacer"></span>
            <span className="img-status"><span className="dot" id="status-dot"></span><span className="nm" id="img-name">no photo</span></span>
          </div>

          <div id="stage">
            <div id="well">
              <div id="frame-outer"></div>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div id="controls">
          <div id="panel-wrap">

            <div className="panel active" id="panel-pos">
              <div className="panel-head"><span className="panel-title">Position</span><button className="reset-btn" id="reset-pos" type="button">Reset</button></div>
              <div className="slider-row"><span className="slider-name">X</span><input type="range" id="tx" min="-600" max="600" defaultValue="0" step="1" /><span className="slider-val" id="tx-val">0px</span></div>
              <div className="slider-row" style={{ marginBottom: 4 }}><span className="slider-name">Y</span><input type="range" id="ty" min="-600" max="600" defaultValue="0" step="1" /><span className="slider-val" id="ty-val">0px</span></div>
              <p className="hint-line">Or drag the photo on the canvas.</p>
            </div>

            <div className="panel" id="panel-scale">
              <div className="panel-head"><span className="panel-title">Scale</span><button className="reset-btn" id="reset-scale" type="button">Reset</button></div>
              <div className="slider-row">
                <span className="slider-name">W</span><input type="range" id="sw" min="10" max="600" defaultValue="100" step="1" /><span className="slider-val" id="sw-val">100%</span>
                <button className="link-btn active" id="link-scale" type="button" title="Link width & height" aria-pressed="true">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 4H3a2 2 0 000 4h2" /><path d="M9 4h2a2 2 0 010 4H9" /><line x1="5" y1="7" x2="9" y2="7" /></svg>
                </button>
              </div>
              <div className="slider-row" style={{ marginBottom: 0 }}><span className="slider-name">H</span><input type="range" id="sh" min="10" max="600" defaultValue="100" step="1" /><span className="slider-val" id="sh-val">100%</span><span style={{ width: 26, flexShrink: 0 }}></span></div>
            </div>

            <div className="panel" id="panel-rot">
              <div className="panel-head"><span className="panel-title">Rotation</span><button className="reset-btn" id="reset-rot" type="button">Reset</button></div>
              <div className="slider-row" style={{ marginBottom: 0 }}><span className="slider-name">&deg;</span><input type="range" id="rot" min="-180" max="180" defaultValue="0" step="1" /><span className="slider-val" id="rot-val">0&deg;</span></div>
            </div>

            <div className="panel" id="panel-flip">
              <div className="panel-head"><span className="panel-title">Flip</span><button className="reset-btn" id="reset-flip" type="button">Reset</button></div>
              <div className="toggle-row">
                <button className="toggle-btn" id="flip-h" type="button">Horizontal</button>
                <button className="toggle-btn" id="flip-v" type="button">Vertical</button>
              </div>
            </div>

            <div className="panel" id="panel-upload">
              <div className="panel-head"><span className="panel-title">Upload</span><button className="reset-btn" id="reset-all" type="button">Reset all</button></div>
              <dl className="meta">
                <dt>Output</dt><dd id="meta-px">—</dd>
                <dt>Photos</dt><dd id="meta-imgs">—</dd>
              </dl>
              <button className="btn-primary" id="upload-btn" type="button">Upload print file</button>
            </div>

          </div>

          <div id="tab-bar">
            <button className="tab-btn active" data-panel="pos" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="2.5" /><line x1="12" y1="2" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="22" /><line x1="2" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="22" y2="12" /></svg>Position</button>
            <button className="tab-btn" data-panel="scale" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>Scale</button>
            <button className="tab-btn" data-panel="rot" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21.5 2v6h-6" /><path d="M21.34 15.57a10 10 0 11-.57-8.38" /></svg>Rotate</button>
            <button className="tab-btn" data-panel="flip" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3" /><path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" /><line x1="12" y1="3" x2="12" y2="21" /></svg>Flip</button>
            <button className="tab-btn" data-panel="upload" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></svg>Upload</button>
          </div>
        </div>
      </div>

      {/* Customer details modal */}
      <div className="overlay" id="details-overlay">
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
          <h2 id="details-title">Your details</h2>
          <p className="lede">So we can match your print file to your order. We only use this to reach you about this print.</p>
          <div className="field">
            <label htmlFor="cust-name">Name</label>
            <input id="cust-name" type="text" autoComplete="name" placeholder="e.g. Rahul Sharma" inputMode="text" />
            <div className="err" id="name-err"></div>
          </div>
          <div className="field">
            <label htmlFor="cust-mobile">Mobile number</label>
            <input id="cust-mobile" type="tel" autoComplete="tel" placeholder="10-digit Indian mobile" inputMode="tel" />
            <div className="err" id="mobile-err"></div>
          </div>
          <div className="modal-actions">
            <button className="btn-ghost" id="details-cancel" type="button">Cancel</button>
            <button className="btn-primary" id="details-confirm" type="button" disabled>Upload now</button>
          </div>
        </div>
      </div>

      <input type="file" id="file-input" accept="image/*" />
      <div id="toast"><span className="ic" id="toast-ic"></span><span className="msg" id="toast-msg"></span></div>
      <canvas id="export-canvas" style={{ display: 'none' }}></canvas>
    </div>
  )
}
