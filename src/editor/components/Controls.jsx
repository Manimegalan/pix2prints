import { useLayoutEffect, useRef, useState } from 'react'
import TabBar from './TabBar.jsx'
import { PositionPanel, ScalePanel, RotationPanel, FlipPanel, UploadPanel } from './Panels.jsx'

const PANELS = {
  pos: PositionPanel,
  scale: ScalePanel,
  rot: RotationPanel,
  flip: FlipPanel,
  upload: UploadPanel,
}

/* Bottom sheet: a collapsible panel that slides open above a fixed icon row.
   `activeTab` is the retained panel (may still be set while closing so it can
   animate out); `panelOpen` controls whether it's expanded. The panel animates
   to its content's own height, so short panels (Upload) stay compact. */
export default function Controls({ editor, activeTab, panelOpen, onSelectTab, onUpload, uploading }) {
  const Panel = activeTab ? PANELS[activeTab] : null
  const innerRef = useRef(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    setHeight(panelOpen && innerRef.current ? innerRef.current.scrollHeight : 0)
  }, [panelOpen, activeTab, uploading])

  return (
    <div id="controls">
      <div id="panel-wrap" style={{ height }}>
        <div ref={innerRef}>
          {Panel && <Panel editor={editor} onUpload={onUpload} uploading={uploading} />}
        </div>
      </div>
      <TabBar activeTab={panelOpen ? activeTab : null} onSelectTab={onSelectTab} />
    </div>
  )
}
