import TabBar from './TabBar.jsx'
import { PositionPanel, ScalePanel, RotationPanel, FlipPanel, UploadPanel } from './Panels.jsx'

const PANELS = {
  pos: PositionPanel,
  scale: ScalePanel,
  rot: RotationPanel,
  flip: FlipPanel,
  upload: UploadPanel,
}

/* Bottom sheet: the active panel's body plus the tab bar underneath. */
export default function Controls({ editor, activeTab, onSelectTab, outputLabel, onUpload, uploading }) {
  const Panel = PANELS[activeTab]

  return (
    <div id="controls">
      <div id="panel-wrap">
        <Panel editor={editor} outputLabel={outputLabel} onUpload={onUpload} uploading={uploading} />
      </div>
      <TabBar activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  )
}
