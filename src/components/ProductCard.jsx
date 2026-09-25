import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CONFIG from '../config.js'
import styles from '../pages/Catalog.module.css'

const CHEVRON_LEFT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
)
const CHEVRON_RIGHT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
)
const ARROW_GO = (
  <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13m0 0-5-5m5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

/* ── Spec line for a product (circle vs rect vs front+back) ────────────── */
function specText(p) {
  if (p.shape === 'circle') return '⌀ ' + p.diameterMm + ' mm'
  let base = p.widthMm + ' × ' + p.heightMm + ' mm'
  if (p.quantity === 2) base += ' · 2 photos'
  return base
}

/* ── Price string ("₹199"); empty if no price configured ────────────────── */
function priceText(p) {
  if (p.price === undefined || p.price === null || p.price === '') return ''
  const cur = (CONFIG.app && CONFIG.app.currency) || ''
  return cur + p.price
}

/* ── Media tag: explicit badge → nothing otherwise ──────────────────────── */
function tagInfo(p) {
  if (p.badge) return { text: p.badge, hot: true }
  return { text: null, hot: false }
}

/* ── Images for a card: per-product override → global default → preview ── */
function cardImages(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images
  if (CONFIG.app && Array.isArray(CONFIG.app.carouselImages) && CONFIG.app.carouselImages.length) {
    return CONFIG.app.carouselImages
  }
  return p.preview ? [p.preview] : []
}

function Carousel({ images }) {
  const [index, setIndex] = useState(0)
  const trackRef = useRef(null)
  const multi = images.length > 1

  function go(i) {
    const next = (i + images.length) % images.length
    setIndex(next)
  }

  function intercept(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className={styles.carousel}>
      <div
        className={styles['carousel-track']}
        ref={trackRef}
        style={{ transform: `translateX(${-index * 100}%)` }}
      >
        {images.map((src, i) => (
          <img key={i} className={styles['carousel-slide']} src={src} alt="" loading="lazy" draggable="false" />
        ))}
      </div>
      {multi && (
        <>
          <button
            type="button"
            className={`${styles['carousel-arrow']} ${styles.prev}`}
            aria-label="Previous image"
            onClick={(e) => { intercept(e); go(index - 1) }}
          >
            {CHEVRON_LEFT}
          </button>
          <button
            type="button"
            className={`${styles['carousel-arrow']} ${styles.next}`}
            aria-label="Next image"
            onClick={(e) => { intercept(e); go(index + 1) }}
          >
            {CHEVRON_RIGHT}
          </button>
          <div className={styles['carousel-dots']}>
            {images.map((_, i) => (
              <span
                key={i}
                className={`${styles['carousel-dot']} ${i === index ? styles.active : ''}`}
                onClick={(e) => { intercept(e); go(i) }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ProductCard({ product }) {
  const tag = tagInfo(product)
  const price = priceText(product)
  const images = cardImages(product)

  return (
    <Link
      className={styles.card}
      to={`/editor?slug=${encodeURIComponent(product.slug)}`}
      data-category={product.category}
      data-name={(product.name + ' ' + (product.subtitle || '')).toLowerCase()}
    >
      <div className={styles['card__media']}>
        {tag.text && (
          <span className={`${styles['card__tag']} ${tag.hot ? styles['card__tag--hot'] : ''}`}>
            {tag.text}
          </span>
        )}
        <Carousel images={images} />
      </div>
      <div className={styles['card__body']}>
        <div className={styles['card__name']}>{product.name}</div>
        <div className={styles['card__variant']}>{product.subtitle || ''}</div>
        <span className={styles['card__dim']}>{specText(product)}</span>
        <div className={styles['card__foot']}>
          <span className={styles.price}><small>From</small><b>{price}</b></span>
          <span className={styles.go} aria-hidden="true">{ARROW_GO}</span>
        </div>
      </div>
    </Link>
  )
}
