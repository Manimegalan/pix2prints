import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CONFIG from '../config.js'
import { useFrameEditor } from './useFrameEditor.js'
import { useToast } from './useToast.js'
import { useCollection } from '../collection/CollectionContext.jsx'
import TopBar from './components/TopBar.jsx'
import GuideBar from './components/GuideBar.jsx'
import Stage, { SIDE_LABELS } from './components/Stage.jsx'
import Controls from './components/Controls.jsx'
import Toast from './components/Toast.jsx'

const DPI = CONFIG.app?.dpi || 300

function makeId() {
  return globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2)
}

/* Orchestrator for a valid product. Editing state lives in useFrameEditor;
   this component wires it to the UI and to the collection flow:
   "Add more" renders the current composition into the collection and clears
   the frame; "Next" adds the current one (if any) and opens the preview. */
export default function EditorView({ product }) {
  const { toast, showToast } = useToast()
  const editor = useFrameEditor(product, { showToast })
  const { geometry } = editor
  const collection = useCollection()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const toggleTab = (id) => {
    if (panelOpen && activeTab === id) setPanelOpen(false)
    else {
      setActiveTab(id)
      setPanelOpen(true)
    }
  }

  const [gridOn, setGridOn] = useState(false)
  const [crossOn, setCrossOn] = useState(false)

  useEffect(() => {
    document.title = 'Pix2Prints — ' + product.name
  }, [product.name])

  const specStr = useMemo(() => {
    let s = geometry.isCircle ? `⌀ ${product.diameterMm} mm` : `${geometry.frameWmm} × ${geometry.frameHmm} mm`
    if (geometry.isTwoSided) s += ' · 2 photos'
    return s
  }, [geometry, product])

  const active = editor.activeState
  const statusLabel = useMemo(() => {
    const label = active.hasImage ? active.imgName || 'photo' : 'no photo'
    return geometry.isTwoSided ? `${SIDE_LABELS[editor.activeFrame]}: ${label}` : label
  }, [active.hasImage, active.imgName, geometry.isTwoSided, editor.activeFrame])

  /* ── Render the current composition into a collection item ────────────── */
  async function renderCurrentToItem() {
    const { renderPrint } = await import('./renderPrint.js') // heavy code, on demand
    const blob = await renderPrint({ frames: editor.frames, geometry, dpi: DPI })
    return {
      id: makeId(),
      product,
      productName: product.name,
      productSlug: product.slug,
      geometry,
      dpi: DPI,
      blob,
      url: URL.createObjectURL(blob),
    }
  }

  const missingPhotoMessage = geometry.isTwoSided
    ? 'Add a photo to both front and back first.'
    : 'Add a photo first.'

  async function handleAddMore() {
    if (!editor.allLoaded) {
      showToast(missingPhotoMessage, 'error')
      return
    }
    setBusy(true)
    try {
      collection.addItem(await renderCurrentToItem())
      navigate('/')
    } catch {
      showToast('Couldn’t add that image. Try again.', 'error')
      setBusy(false)
    }
  }

  async function handleNext() {
    let total = collection.count
    if (editor.allLoaded) {
      setBusy(true)
      try {
        collection.addItem(await renderCurrentToItem())
        total += 1
      } catch {
        showToast('Couldn’t prepare the preview. Try again.', 'error')
        setBusy(false)
        return
      }
    }
    if (total === 0) {
      showToast(missingPhotoMessage, 'error')
      return
    }
    navigate('/preview')
  }

  const upload = {
    onAddMore: handleAddMore,
    onNext: handleNext,
    busy,
    canAddMore: editor.allLoaded,
    canNext: editor.allLoaded || collection.count > 0,
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
          panelOpen={panelOpen}
          onSelectTab={toggleTab}
          upload={upload}
        />
      </div>

      <input ref={editor.fileInputRef} type="file" id="file-input" accept="image/*" onChange={editor.onFileInputChange} />
      <Toast toast={toast} />
    </div>
  )
}
