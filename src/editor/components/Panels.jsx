import Slider from './Slider.jsx'

/* The five control-panel bodies. Each is a small, focused component driven
   entirely by the active frame's state + the editor's setters. Only the
   panel matching the active tab is rendered by Controls. */

function PanelHead({ title, resetLabel = 'Reset', onReset }) {
  return (
    <div className="panel-head">
      <span className="panel-title">{title}</span>
      <button className="reset-btn" type="button" onClick={onReset}>
        {resetLabel}
      </button>
    </div>
  )
}

export function PositionPanel({ editor }) {
  const { activeState, size } = editor
  const pxX = Math.round(activeState.offsetX * size.slotW)
  const pxY = Math.round(activeState.offsetY * size.frameH)
  const bound = (px) => Math.max(600, Math.abs(px))

  return (
    <div className="panel active" id="panel-pos">
      <PanelHead title="Position" onReset={editor.resetPosition} />
      <Slider
        name="X"
        min={-bound(pxX)}
        max={bound(pxX)}
        value={pxX}
        display={`${pxX}px`}
        onChange={editor.setActiveOffsetXPx}
      />
      <Slider
        name="Y"
        min={-bound(pxY)}
        max={bound(pxY)}
        value={pxY}
        display={`${pxY}px`}
        onChange={editor.setActiveOffsetYPx}
        style={{ marginBottom: 4 }}
      />
      <p className="hint-line">Or drag the photo on the canvas.</p>
    </div>
  )
}

export function ScalePanel({ editor }) {
  const { activeState } = editor
  const pctW = Math.round(activeState.scaleW * 100)
  const pctH = Math.round(activeState.scaleH * 100)

  const linkButton = (
    <button
      className={'link-btn' + (activeState.linked ? ' active' : '')}
      type="button"
      title="Link width & height"
      aria-pressed={activeState.linked}
      onClick={editor.toggleLink}
    >
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 4H3a2 2 0 000 4h2" />
        <path d="M9 4h2a2 2 0 010 4H9" />
        <line x1="5" y1="7" x2="9" y2="7" />
      </svg>
    </button>
  )

  return (
    <div className="panel active" id="panel-scale">
      <PanelHead title="Scale" onReset={editor.resetScale} />
      <Slider
        name="W"
        min={10}
        max={600}
        value={pctW}
        display={`${pctW}%`}
        onChange={editor.setActiveScaleWPct}
        trailing={linkButton}
      />
      <Slider
        name="H"
        min={10}
        max={600}
        value={pctH}
        display={`${pctH}%`}
        onChange={editor.setActiveScaleHPct}
        trailing={<span style={{ width: 26, flexShrink: 0 }} />}
        style={{ marginBottom: 0 }}
      />
    </div>
  )
}

export function RotationPanel({ editor }) {
  const deg = editor.activeState.rotation
  return (
    <div className="panel active" id="panel-rot">
      <PanelHead title="Rotation" onReset={editor.resetRotation} />
      <Slider
        name="°"
        min={-180}
        max={180}
        value={deg}
        display={`${deg}°`}
        onChange={editor.setActiveRotation}
        style={{ marginBottom: 0 }}
      />
    </div>
  )
}

export function FlipPanel({ editor }) {
  const { activeState } = editor
  return (
    <div className="panel active" id="panel-flip">
      <PanelHead title="Flip" onReset={editor.resetFlip} />
      <div className="toggle-row">
        <button
          className={'toggle-btn' + (activeState.flipH ? ' active' : '')}
          type="button"
          onClick={editor.toggleFlipH}
        >
          Horizontal
        </button>
        <button
          className={'toggle-btn' + (activeState.flipV ? ' active' : '')}
          type="button"
          onClick={editor.toggleFlipV}
        >
          Vertical
        </button>
      </div>
    </div>
  )
}

export function UploadPanel({ editor, upload }) {
  const { onAddMore, onNext, busy, canAddMore, canNext } = upload
  return (
    <div className="panel active" id="panel-upload">
      <PanelHead title="Finish" resetLabel="Reset all" onReset={editor.resetAll} />
      <div className="upload-actions">
        <button className="btn-ghost" type="button" onClick={onAddMore} disabled={!canAddMore || busy}>
          {busy ? 'Working…' : 'Add more'}
        </button>
        <button className="btn-primary" type="button" onClick={onNext} disabled={!canNext || busy}>
          Next
        </button>
      </div>
    </div>
  )
}
