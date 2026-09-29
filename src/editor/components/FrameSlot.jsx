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
}) {
  const drag = useRef(null)
  const { slotW, frameH } = size
  const { baseW, baseH } = coverFitBaseline(frame.naturalAspect, slotW, frameH)

  const tx = frame.offsetX * slotW
  const ty = frame.offsetY * frameH
  const scaleX = frame.scaleW * (frame.flipH ? -1 : 1)
  const scaleY = frame.scaleH * (frame.flipV ? -1 : 1)
  const transform = `translate(${tx}px,${ty}px) rotate(${frame.rotation}deg) scale(${scaleX},${scaleY})`

  const isMoved =
    Math.abs(tx) > 4 || Math.abs(ty) > 4 || frame.scaleW > 1.05 || frame.scaleH > 1.05 || frame.rotation !== 0

  /* ── Drag to pan (or tap an empty slot to pick a photo) ──────────────── */
  function handlePointerDown(e) {
    if (e.button != null && e.button !== 0) return
    onActivate(index)
    if (!frame.hasImage) {
      onRequestImage(index)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseTx: tx, baseTy: ty }
  }
  function handlePointerMove(e) {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return
    const nextTx = drag.current.baseTx + (e.clientX - drag.current.startX)
    const nextTy = drag.current.baseTy + (e.clientY - drag.current.startY)
    onPan(index, nextTx / slotW, nextTy / frameH)
  }
  function endDrag(e) {
    if (drag.current?.pointerId === e.pointerId) drag.current = null
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
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
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
