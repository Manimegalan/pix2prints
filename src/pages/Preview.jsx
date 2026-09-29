import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CONFIG from '../config.js'
import { useCollection } from '../collection/CollectionContext.jsx'
import { useToast } from '../editor/useToast.js'
import Toast from '../editor/components/Toast.jsx'
import DetailsModal from '../editor/components/DetailsModal.jsx'
import { uploadPrint } from '../editor/upload.js'
import './Editor.css' // shared design tokens + modal / button / toast styles
import styles from './Preview.module.css'

const ENDPOINT = CONFIG.app?.uploadEndpoint || ''

/* Preview / carousel page: review every composed print, remove any, then
   upload them all after entering contact details once. */
export default function Preview() {
  const { items, count, removeItem, clear } = useCollection()
  const navigate = useNavigate()
  const { toast, showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [index, setIndex] = useState(0)

  function onScroll(e) {
    const el = e.currentTarget
    const i = Math.min(items.length - 1, Math.round(el.scrollLeft / el.clientWidth))
    if (i !== index) setIndex(i)
  }

  function startUpload() {
    if (!ENDPOINT) return showToast('No upload endpoint is configured.', 'error')
    if (!/^https:\/\//i.test(ENDPOINT)) return showToast('Upload endpoint must be an https:// URL.', 'error')
    if (count === 0) return showToast('Your collection is empty.', 'error')
    setModalOpen(true)
  }

  async function confirmUpload(customer) {
    setModalOpen(false)
    setUploading(true)
    const batch = [...items]
    let done = 0
    try {
      for (const item of batch) {
        showToast(`Uploading ${done + 1} of ${batch.length}…`, 'loading', 0)
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadPrint({
          endpoint: ENDPOINT,
          blob: item.blob,
          product: item.product,
          geometry: item.geometry,
          customer,
          dpi: item.dpi,
        })
        if (res.status !== 200) throw new Error('status ' + res.status)
        done += 1
      }
      showToast('All prints uploaded — thanks!', 'success')
      clear()
      setTimeout(() => navigate('/'), 1000)
    } catch {
      showToast(`Uploaded ${done} of ${batch.length}. Something failed — please try again.`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const header = (
    <header className={styles.head}>
      <button className={styles.back} type="button" onClick={() => navigate('/')} aria-label="Back to catalog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <h1 className={styles.title}>{count > 0 ? `Your prints (${count})` : 'Your prints'}</h1>
      <span className={styles.spacer} />
    </header>
  )

  if (count === 0) {
    return (
      <div className={styles.page}>
        {header}
        <div className={styles.empty}>
          <p>No prints in your collection yet.</p>
          <button className="btn-primary" type="button" onClick={() => navigate('/')}>
            Browse products
          </button>
        </div>
        <Toast toast={toast} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {header}

      <div className={styles.carousel} onScroll={onScroll}>
        {items.map((item) => (
          <div className={styles.slide} key={item.id}>
            <div className={styles.card}>
              <button
                className={styles.remove}
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.productName}`}
                disabled={uploading}
              >
                ✕
              </button>
              <div className={styles.thumbWrap}>
                <img className={styles.thumb} src={item.url} alt={item.productName} style={item.geometry.isCircle ? { borderRadius: '50%' } : undefined} />
              </div>
              <div className={styles.meta}>
                <div className={styles.pname}>{item.productName}</div>
                {item.product.subtitle && <div className={styles.psub}>{item.product.subtitle}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dots}>
        {items.map((it, i) => (
          <span key={it.id} className={i === index ? styles.dotOn : styles.dot} />
        ))}
      </div>

      <div className={styles.actions}>
        <button className="btn-ghost" type="button" onClick={() => navigate('/')} disabled={uploading}>
          Add more
        </button>
        <button className="btn-primary" type="button" onClick={startUpload} disabled={uploading}>
          {uploading ? 'Uploading…' : `Upload all (${count})`}
        </button>
      </div>

      {modalOpen && <DetailsModal onConfirm={confirmUpload} onCancel={() => setModalOpen(false)} />}
      <Toast toast={toast} />
    </div>
  )
}
