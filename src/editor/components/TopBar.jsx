import { Link } from 'react-router-dom'

/* Back button, product title/spec, and the "Photo" load button. */
export default function TopBar({ product, specStr, onLoadPhoto }) {
  const title = product.name + (product.subtitle ? ` · ${product.subtitle}` : '')

  return (
    <div id="topbar">
      <Link className="icon-btn" to="/" aria-label="Back to catalog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </Link>

      <div className="top-title">
        <div className="name">{title}</div>
        <div className="spec">{specStr}</div>
      </div>

      <button id="load-btn" type="button" onClick={onLoadPhoto}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Photo
      </button>
    </div>
  )
}
