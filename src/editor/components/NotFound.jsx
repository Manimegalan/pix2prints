import { Link } from 'react-router-dom'

/* Shown when the ?slug in the URL doesn't match any configured product. */
export default function NotFound({ slug }) {
  return (
    <div className="editor-page">
      <div id="notfound">
        <div className="nf-card">
          <div className="mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="13" />
              <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
            </svg>
          </div>
          <h2>Product not found</h2>
          <p>
            {slug
              ? `We couldn't find a product for "${slug}". It may have been renamed or removed.`
              : 'No product was specified. Head back to the catalog to pick one.'}
          </p>
          <Link to="/">Back to catalog</Link>
        </div>
      </div>
    </div>
  )
}
