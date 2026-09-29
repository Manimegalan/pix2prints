import { useRef } from 'react'
import { coverFitBaseline } from '../geometry.js'

/* One photo slot: the clipped, draggable image plus its soft "overflow"
   ghost behind the frame. All positions are derived from props — the
   component itself holds only the transient drag session in a ref. */

const CORNER_STYLES = [
  { top: 0, left: 0, borderWidth: '2px 0 0 2px' },
  { top: 0, right: 0, borderWidth: '2px 2px 0 0' },
  { bottom: 0, left: 0, borderWidth: '0 0 2px 2px' },
  { bottom: 0, right: 0, borderWidth: '0 2px 2px 0' },
]

const MIN_SCALE = 0.1 // 10% — matches the scale slider
const MAX_SCALE = 6 // 600%
const clampScale = (v) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v))

const UploadHintIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

export default function FrameSlot({
  index,
  frame,
  geometry,
  size,
  isActive,
  gridOn,
  crossOn,
  sideLabel,
  onActivate,
  onRequestImage,
  onPan,
  onTransform,
}) {
  // One gesture at a time. `pointers` holds every finger currently down on
  // this slot; `mode` is 'pan' (one finger) or 'pinch' (two fingers), and
  // `base` captures the frame transform + touch geometry at gesture start.
  const gesture = useRef({ pointers: new Map(), mode: 'none', base: null })
  const { slotW, frameH } = size
  const { baseW, baseH } = coverFitBaseline(frame.naturalAspect, slotW, frameH)

  const tx = frame.offsetX * slotW
  const ty = frame.offsetY * frameH
  const scaleX = frame.scaleW * (frame.flipH ? -1 : 1)
  const scaleY = frame.scaleH * (frame.flipV ? -1 : 1)
  const transform = `translate(${tx}px,${ty}px) rotate(${frame.rotation}deg) scale(${scaleX},${scaleY})`

  const isMoved =
    Math.abs(tx) > 4 || Math.abs(ty) > 4 || frame.scaleW > 1.05 || frame.scaleH > 1.05 || frame.rotation !== 0

  /* ── Gestures: one finger pans, two fingers pinch-scale (+ pan) ──────── */
  function twoPointers() {
    return Array.from(gesture.current.pointers.values())
  }
  function pinchMetrics() {
    const [a, b] = twoPointers()
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    }
  }
  function startPan() {
    const [p] = twoPointers()
    gesture.current.mode = 'pan'
    gesture.current.base = { startX: p.x, startY: p.y, baseTx: tx, baseTy: ty }
  }
  function startPinch() {
    const { dist, midX, midY } = pinchMetrics()
    gesture.current.mode = 'pinch'
    gesture.current.base = {
      startDist: dist,
      startMidX: midX,
      startMidY: midY,
      baseScaleW: frame.scaleW,
      baseScaleH: frame.scaleH,
      baseTx: tx,
      baseTy: ty,
    }
  }

  function handlePointerDown(e) {
    if (e.button != null && e.button !== 0) return
    onActivate(index)
    if (!frame.hasImage) {
      onRequestImage(index)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const count = gesture.current.pointers.size
    if (count === 1) startPan()
    else if (count === 2) startPinch()
  }

  function handlePointerMove(e) {
    const g = gesture.current
    if (!g.pointers.has(e.pointerId)) return
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (g.mode === 'pinch' && g.pointers.size >= 2) {
      const { dist, midX, midY } = pinchMetrics()
      const ratio = dist / g.base.startDist
      onTransform(index, {
        scaleW: clampScale(g.base.baseScaleW * ratio),
        scaleH: clampScale(g.base.baseScaleH * ratio),
        offsetX: (g.base.baseTx + (midX - g.base.startMidX)) / slotW,
        offsetY: (g.base.baseTy + (midY - g.base.startMidY)) / frameH,
      })
    } else if (g.mode === 'pan' && g.pointers.size === 1) {
      const nextTx = g.base.baseTx + (e.clientX - g.base.startX)
      const nextTy = g.base.baseTy + (e.clientY - g.base.startY)
      onPan(index, nextTx / slotW, nextTy / frameH)
    }
  }

  function endPointer(e) {
    const g = gesture.current
    if (!g.pointers.delete(e.pointerId)) return
    // Lifting one finger of a pinch: fall back to panning with the other,
    // re-basing from the current transform so the image doesn't jump.
    if (g.pointers.size === 1) startPan()
    else if (g.pointers.size === 0) {
      g.mode = 'none'
      g.base = null
    }
  }

  return (
    <>
      {/* Soft overflow preview behind the frame */}
      <div
        className="slot-ghost"
        style={{
          left: index * slotW + slotW / 2 - baseW / 2,
          top: frameH / 2 - baseH / 2,
          width: baseW,
          height: baseH,
          transformOrigin: `${baseW / 2}px ${baseH / 2}px`,
          transform,
          opacity: frame.hasImage && isMoved ? 0.22 : 0,
        }}
      >
        {frame.hasImage && <img src={frame.imgSrc} alt="" draggable={false} />}
      </div>

      {/* The clipped slot itself */}
      <div
        className={'frame-slot' + (isActive ? ' active-slot' : '')}
        style={{
          left: index * slotW,
          width: slotW,
          height: frameH,
          borderRadius: geometry.isCircle ? '50%' : undefined,
          // Stop the browser from claiming touch-drags as scroll/zoom
          // gestures (which would fire pointercancel and kill the pan).
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <div
          className="slot-layer"
          style={{
            width: baseW,
            height: baseH,
            left: slotW / 2 - baseW / 2,
            top: frameH / 2 - baseH / 2,
            transform,
          }}
        >
          {frame.hasImage && <img src={frame.imgSrc} alt="" draggable={false} />}
        </div>

        <div className={'slot-grid-overlay' + (gridOn ? ' visible' : '')} />
        <div className={'slot-center-cross' + (crossOn ? ' visible' : '')} />

        {!geometry.isCircle &&
          CORNER_STYLES.map((style, i) => <div key={i} className="slot-corner" style={style} />)}

        {!frame.hasImage && (
          <div className="slot-hint" style={{ display: 'flex' }}>
            <div className="ic">
              <UploadHintIcon />
            </div>
            <p>
              {geometry.isTwoSided ? sideLabel : 'Tap to add a photo'}
              <br />
              or drop it here
            </p>
          </div>
        )}

        {geometry.isTwoSided && <div className="slot-badge">{index + 1}</div>}
      </div>
    </>
  )
}
