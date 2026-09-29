import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveGeometry, fitFrameToWell } from './geometry.js'

/* ═══════════════════════════════════════════════════════════════════════════
   useFrameEditor — the single source of truth for the editing canvas.
   ---------------------------------------------------------------------------
   Holds one transform state per photo slot, tracks which slot is active,
   and measures how big to draw the frame inside the stage well. Everything
   is plain React state + refs — no direct DOM reads, no getElementById.

   Slider units: the panels speak pixels / percent / degrees, so the setters
   here accept those units and convert to the normalised model internally.
   ═══════════════════════════════════════════════════════════════════════════ */

function makeFrame() {
  return {
    hasImage: false,
    imgSrc: '',
    imgName: '',
    naturalAspect: 1,
    offsetX: 0, // normalised: fraction of slot width
    offsetY: 0, // normalised: fraction of frame height
    scaleW: 1,
    scaleH: 1,
    rotation: 0, // degrees
    flipH: false,
    flipV: false,
    linked: true, // keep width & height scale in sync
  }
}

function shortName(name) {
  const nm = name || 'photo'
  return nm.length > 18 ? nm.slice(0, 16) + '…' : nm
}

export function useFrameEditor(product, { showToast }) {
  const geometry = useMemo(() => deriveGeometry(product), [product])

  const [frames, setFrames] = useState(() => [makeFrame(), makeFrame()])
  const [activeFrame, setActiveFrame] = useState(0)
  const [size, setSize] = useState({ frameW: 300, frameH: 300, slotW: 300 })

  const wellRef = useRef(null)
  const fileInputRef = useRef(null)
  const pendingFrameRef = useRef(0) // which slot a pending file dialog fills

  /* ── Measure the well and keep the frame fitted to it ─────────────────── */
  useEffect(() => {
    const well = wellRef.current
    if (!well) return undefined

    const measure = () => {
      setSize(fitFrameToWell(geometry, well.clientWidth, well.clientHeight))
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(well)
    return () => observer.disconnect()
  }, [geometry])

  /* ── Frame updates ────────────────────────────────────────────────────── */
  const updateFrame = useCallback((index, patch) => {
    setFrames((prev) =>
      prev.map((frame, i) =>
        i === index ? { ...frame, ...(typeof patch === 'function' ? patch(frame) : patch) } : frame,
      ),
    )
  }, [])

  const updateActive = useCallback(
    (patch) => updateFrame(activeFrame, patch),
    [activeFrame, updateFrame],
  )

  /* ── Load a photo into a slot ─────────────────────────────────────────── */
  const loadImageFile = useCallback(
    (file, index) => {
      if (!file) return
      const reader = new FileReader()
      reader.onerror = () => showToast('Couldn’t read that file. Please use a JPG or PNG.', 'error')
      reader.onload = (e) => {
        const src = e.target.result
        const img = new Image()
        img.onerror = () => showToast('That image couldn’t be opened. Please use a JPG or PNG.', 'error')
        img.onload = () => {
          updateFrame(index, {
            ...makeFrame(),
            hasImage: true,
            imgSrc: src,
            imgName: shortName(file.name),
            naturalAspect: img.naturalWidth / img.naturalHeight || 1,
          })
        }
        img.src = src
      }
      reader.readAsDataURL(file)
    },
    [showToast, updateFrame],
  )

  const openFilePicker = useCallback((index) => {
    pendingFrameRef.current = index
    fileInputRef.current?.click()
  }, [])

  const onFileInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (file) loadImageFile(file, pendingFrameRef.current)
      e.target.value = ''
    },
    [loadImageFile],
  )

  /* ── Drop a file anywhere on the page → active slot ───────────────────── */
  useEffect(() => {
    const onDragOver = (e) => e.preventDefault()
    const onDrop = (e) => {
      e.preventDefault()
      const file = e.dataTransfer?.files?.[0]
      if (file) loadImageFile(file, activeFrame)
    }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [activeFrame, loadImageFile])

  /* ── Unit-aware setters used by the control panels ────────────────────── */
  const setFrameOffset = useCallback(
    (index, offsetX, offsetY) => updateFrame(index, { offsetX, offsetY }),
    [updateFrame],
  )

  // Apply an arbitrary transform patch to a slot in one update — used by the
  // pinch gesture, which changes scale and offset together.
  const setFrameTransform = useCallback(
    (index, patch) => updateFrame(index, patch),
    [updateFrame],
  )

  const setActiveOffsetXPx = useCallback(
    (px) => updateActive((f) => ({ ...f, offsetX: px / size.slotW })),
    [size.slotW, updateActive],
  )
  const setActiveOffsetYPx = useCallback(
    (px) => updateActive((f) => ({ ...f, offsetY: px / size.frameH })),
    [size.frameH, updateActive],
  )
  const setActiveScaleWPct = useCallback(
    (pct) =>
      updateActive((f) => {
        const scaleW = pct / 100
        return { ...f, scaleW, scaleH: f.linked ? scaleW : f.scaleH }
      }),
    [updateActive],
  )
  const setActiveScaleHPct = useCallback(
    (pct) =>
      updateActive((f) => {
        const scaleH = pct / 100
        return { ...f, scaleH, scaleW: f.linked ? scaleH : f.scaleW }
      }),
    [updateActive],
  )
  const setActiveRotation = useCallback(
    (deg) => updateActive({ rotation: deg }),
    [updateActive],
  )

  const toggleFlipH = useCallback(() => updateActive((f) => ({ ...f, flipH: !f.flipH })), [updateActive])
  const toggleFlipV = useCallback(() => updateActive((f) => ({ ...f, flipV: !f.flipV })), [updateActive])
  const toggleLink = useCallback(
    () => updateActive((f) => ({ ...f, linked: !f.linked, scaleH: !f.linked ? f.scaleW : f.scaleH })),
    [updateActive],
  )

  /* ── Resets ───────────────────────────────────────────────────────────── */
  const resetPosition = useCallback(() => updateActive({ offsetX: 0, offsetY: 0 }), [updateActive])
  const resetScale = useCallback(() => updateActive({ scaleW: 1, scaleH: 1 }), [updateActive])
  const resetRotation = useCallback(() => updateActive({ rotation: 0 }), [updateActive])
  const resetFlip = useCallback(() => updateActive({ flipH: false, flipV: false }), [updateActive])
  const resetAll = useCallback(() => {
    setFrames((prev) =>
      prev.map((f) => ({ ...f, offsetX: 0, offsetY: 0, scaleW: 1, scaleH: 1, rotation: 0, flipH: false, flipV: false })),
    )
  }, [])

  // Wipe photos and transforms back to blank — used after a composition is
  // added to the collection so the next one starts fresh.
  const clearFrames = useCallback(() => {
    setFrames([makeFrame(), makeFrame()])
    setActiveFrame(0)
  }, [])

  const loadedCount = frames
    .slice(0, geometry.photoCount)
    .filter((f) => f.hasImage).length

  return {
    geometry,
    size,
    frames,
    activeFrame,
    activeState: frames[activeFrame],
    loadedCount,
    allLoaded: loadedCount === geometry.photoCount,
    wellRef,
    fileInputRef,
    selectFrame: setActiveFrame,
    openFilePicker,
    onFileInputChange,
    setFrameOffset,
    setFrameTransform,
    setActiveOffsetXPx,
    setActiveOffsetYPx,
    setActiveScaleWPct,
    setActiveScaleHPct,
    setActiveRotation,
    toggleFlipH,
    toggleFlipV,
    toggleLink,
    resetPosition,
    resetScale,
    resetRotation,
    resetFlip,
    resetAll,
    clearFrames,
  }
}
