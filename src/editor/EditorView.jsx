import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import CONFIG from '../config.js'
import { exportSize } from './geometry.js'
import { useFrameEditor } from './useFrameEditor.js'
import { useToast } from './useToast.js'
import TopBar from './components/TopBar.jsx'
import GuideBar from './components/GuideBar.jsx'
import Stage, { SIDE_LABELS } from './components/Stage.jsx'
import Controls from './components/Controls.jsx'
import Toast from './components/Toast.jsx'

// Code-split: the details modal only loads when the user starts an upload.
const DetailsModal = lazy(() => import('./components/DetailsModal.jsx'))

const DPI = CONFIG.app?.dpi || 300
const ENDPOINT = CONFIG.app?.uploadEndpoint || ''

/* Orchestrator for a valid product. All the editing state lives in
   useFrameEditor; this component just wires hooks to components and runs
   the upload flow. */
export default function EditorView({ product }) {
  const { toast, showToast } = useToast()
  const editor = useFrameEditor(product, { showToast })
  const { geometry } = editor

  const [activeTab, setActiveTab] = useState('pos')
  const [gridOn, setGridOn] = useState(false)
  const [crossOn, setCrossOn] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    document.title = 'Pix2Prints — ' + product.name
  }, [product.name])

  /* ── Display strings ──────────────────────────────────────────────────── */
  const specStr = useMemo(() => {
    let s = geometry.isCircle ? `⌀ ${product.diameterMm} mm` : `${geometry.frameWmm} × ${geometry.frameHmm} mm`
    if (geometry.isTwoSided) s += ' · 2 photos'
    return s
  }, [geometry, product])

  const outputLabel = useMemo(() => {
    const { canvasW, canvasH } = exportSize(geometry, DPI)
    return `${canvasW} × ${canvasH} px`
  }, [geometry])

  const active = editor.activeState
  const statusLabel = useMemo(() => {
    const label = active.hasImage ? active.imgName || 'photo' : 'no photo'
    return geometry.isTwoSided ? `${SIDE_LABELS[editor.activeFrame]}: ${label}` : label
  }, [active.hasImage, active.imgName, geometry.isTwoSided, editor.activeFrame])

  /* ── Upload flow ──────────────────────────────────────────────────────── */
  function startUpload() {
    if (!ENDPOINT) return showToast('No upload endpoint is configured.', 'error')
    if (!/^https:\/\//i.test(ENDPOINT)) return showToast('Upload endpoint must be an https:// URL.', 'error')
    if (!editor.allLoaded) {
      return showToast(geometry.isTwoSided ? 'Add a photo to both front and back first.' : 'Add a photo first.', 'error')
    }
    setModalOpen(true)
  }

  async function confirmUpload(customer) {
    setModalOpen(false)
    setUploading(true)
    showToast('Uploading your print file…', 'loading', 0)

    try {
      // Pull the heavy export + upload code in on demand (separate chunk).
      const [{ renderPrint }, { uploadPrint }] = await Promise.all([
        import('./renderPrint.js'),
        import('./upload.js'),
      ])

      const blob = await renderPrint({ frames: editor.frames, geometry, dpi: DPI })
      const res = await uploadPrint({ endpoint: ENDPOINT, blob, product, geometry, customer, dpi: DPI })

      if (res.status === 200) {
        showToast('Uploaded. We’ll get printing — thanks!', 'success')
      } else {
        showToast('Upload failed (server responded ' + res.status + '). Try again.', 'error')
      }
    } catch (err) {
      const m = (err && err.message) || ''
      showToast(/fetch|network|Failed/i.test(m) ? 'Couldn’t reach the server. Try again.' : 'Upload failed. Try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="editor-page">
      <div id="app">
        <TopBar product={product} specStr={specStr} onLoadPhoto={() => editor.openFilePicker(editor.activeFrame)} />

        <div id="canvas-zone">
          <GuideBar
            gridOn={gridOn}
            crossOn={crossOn}
            onToggleGrid={() => setGridOn((v) => !v)}
            onToggleCross={() => setCrossOn((v) => !v)}
            statusOn={active.hasImage}
            statusLabel={statusLabel}
          />
          <Stage editor={editor} gridOn={gridOn} crossOn={crossOn} />
        </div>

        <Controls
          editor={editor}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          outputLabel={outputLabel}
          onUpload={startUpload}
          uploading={uploading}
        />
      </div>

      {modalOpen && (
        <Suspense fallback={null}>
          <DetailsModal onConfirm={confirmUpload} onCancel={() => setModalOpen(false)} />
        </Suspense>
      )}

      <input ref={editor.fileInputRef} type="file" id="file-input" accept="image/*" onChange={editor.onFileInputChange} />
      <Toast toast={toast} />
    </div>
  )
}
