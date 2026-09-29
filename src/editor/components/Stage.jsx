import FrameSlot from './FrameSlot.jsx'

const SIDE_LABELS = ['Front', 'Back']

/* The canvas area: guide bar on top, then the fitted frame inside the well.
   `wellRef` is measured by the hook's ResizeObserver to size the frame. */
export default function Stage({ editor, gridOn, crossOn }) {
  const { geometry, size, frames, activeFrame, wellRef } = editor
  const slots = Array.from({ length: geometry.photoCount }, (_, i) => i)

  return (
    <div id="stage">
      <div id="well" ref={wellRef}>
        <div id="frame-outer" style={{ width: size.frameW, height: size.frameH }}>
          {slots.map((i) => (
            <FrameSlot
              key={i}
              index={i}
              frame={frames[i]}
              geometry={geometry}
              size={size}
              isActive={i === activeFrame}
              gridOn={gridOn}
              crossOn={crossOn}
              sideLabel={SIDE_LABELS[i]}
              onActivate={editor.selectFrame}
              onRequestImage={editor.openFilePicker}
              onPan={editor.setFrameOffset}
              onTransform={editor.setFrameTransform}
            />
          ))}

          {geometry.isTwoSided && <div className="frame-divider" style={{ height: size.frameH }} />}
          {geometry.isCircle && !geometry.isTwoSided && <div className="circle-ring" />}
        </div>
      </div>
    </div>
  )
}

export { SIDE_LABELS }
