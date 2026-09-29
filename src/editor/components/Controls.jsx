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
   animate out); `panelOpen` controls whether it's expanded. */
export default function Controls({ editor, activeTab, panelOpen, onSelectTab, outputLabel, onUpload, uploading }) {
  const Panel = activeTab ? PANELS[activeTab] : null

  return (
    <div id="controls">
      <div id="panel-wrap" className={panelOpen ? 'open' : ''}>
        {Panel && (
          <Panel editor={editor} outputLabel={outputLabel} onUpload={onUpload} uploading={uploading} />
        )}
      </div>
      <TabBar activeTab={panelOpen ? activeTab : null} onSelectTab={onSelectTab} />
    </div>
  )
}
