import { useMemo, useState } from 'react'
import CONFIG from '../config.js'
import ProductCard from '../components/ProductCard.jsx'
import styles from './Catalog.module.css'

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = useMemo(
    () => [{ id: 'all', label: 'All' }, ...(CONFIG.categories || [])],
    []
  )

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return (CONFIG.products || []).filter((p) => {
      const catOk = activeCategory === 'all' || p.category === activeCategory
      const name = (p.name + ' ' + (p.subtitle || '')).toLowerCase()
      const textOk = !term || name.indexOf(term) !== -1
      return catOk && textOk
    })
  }, [activeCategory, searchTerm])

  if (!CONFIG || !Array.isArray(CONFIG.products)) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Catalog failed to load. Check that config.js is present.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <main className={styles.phone} role="main">

        {/* HEADER */}
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles['brand__logo']} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="#fff" strokeWidth="1.8" /><path d="M3 15l4.5-4.5 3.5 3.5 3-3L21 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="9" r="1.6" fill="#fff" /></svg>
            </span>
            <div>
              <div className={styles['brand__name']}>Pix2Prints</div>
              <div className={styles['brand__tag']}>Photo print studio</div>
            </div>
          </div>
          <button className={styles.cart} aria-label="Bag, 0 items">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 8h12l-.85 10.2A2 2 0 0 1 15.16 20H8.84a2 2 0 0 1-1.99-1.8L6 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 8V6.6a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <span className={styles['cart__count']}>0</span>
          </button>
        </header>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles['hero__blob']} aria-hidden="true"></div>
          <div className={styles['hero__inner']}>
            <span className={styles.eyebrow}>Your photo · your gift</span>
            <h1 className={styles['hero__title']}>Turn your photos into things you can hold.</h1>
            <p className={styles['hero__sub']}>Pick a product, drop in a photo, and fit it to the exact print area. We handle the printing and the finish.</p>

            <div className={styles['hero__cta']}>
              <a className={`${styles.btn} ${styles['btn--primary']}`} href="#products">
                <svg fill="#fff" viewBox="0 0 24 24"><path d="M15.716,4.354a8.031,8.031,0,1,0-2.7,13.138l3.58,3.581A3.164,3.164,0,0,0,21.073,16.6l-3.58-3.58A8.046,8.046,0,0,0,15.716,4.354ZM10.034,16.069A6.033,6.033,0,1,1,14.3,14.3,6,6,0,0,1,10.034,16.069Zm9.625,1.943a1.165,1.165,0,0,1-1.647,1.647l-3.186-3.186a8.214,8.214,0,0,0,.89-.757,8.214,8.214,0,0,0,.757-.89ZM11.035,14a1,1,0,0,1-1,1,4.972,4.972,0,0,1-4.966-4.965,1.014,1.014,0,0,1,1-1.017.984.984,0,0,1,1,.982v.035A2.968,2.968,0,0,0,10.035,13,1,1,0,0,1,11.035,14Z" /></svg>
                Browse products
              </a>
            </div>

            <div className={styles.specs}>
              <span className={styles.spec}><svg viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>300 DPI</span>
              <span className={styles.spec}><svg viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>Print-ready</span>
              <span className={styles.spec}><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Made to order · ~3 days</span>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <div className={styles.search}>
          <svg className={styles.mag} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <input
            id="search-input"
            type="search"
            placeholder="Search products"
            autoComplete="off"
            aria-label="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* EXPLORE */}
        <div className={styles['explore-head']}>
          <h2>Explore</h2>
          <span className={styles.count}>
            {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        {/* Category filter chips */}
        <div className={styles.chips} role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={styles.chip}
              aria-pressed={c.id === activeCategory ? 'true' : 'false'}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <section className={styles.grid} id="products" aria-label="Products">
          {visibleProducts.length === 0 ? (
            <p className={styles.empty}>No products match your filters.</p>
          ) : (
            visibleProducts.map((p) => <ProductCard key={p.slug} product={p} />)
          )}
        </section>

        {/* FOOTER */}
        <footer className={styles.foot}>
          <div className={styles['foot__help']}>
            <div className={styles['foot__eyebrow']}>We're here</div>
            <h3>Questions about your order?</h3>
            <p>Chat with the studio — real people, quick replies. No account needed.</p>
            <div className={styles['foot__help-actions']}>
              <a className={`${styles.hbtn} ${styles['hbtn--wa']}`} href="#">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.9.5 3.66 1.36 5.2L2 22l5.1-1.5a9.8 9.8 0 0 0 4.94 1.32h.01c5.44 0 9.84-4.4 9.84-9.84C21.9 6.4 17.48 2 12.04 2Zm5.76 13.9c-.24.68-1.4 1.32-1.94 1.36-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.26-4.8-4.19-4.94-4.38-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36l.56.01c.18.01.42-.07.66.5.24.58.82 2 .9 2.15.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.59.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.14.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.65-.14.27.09 1.68.79 1.97.94.29.14.48.21.55.33.07.12.07.69-.17 1.37Z" /></svg>
                WhatsApp
              </a>
              <a className={`${styles.hbtn} ${styles['hbtn--ig']}`} href="#">
                <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" /></svg>
                Instagram
              </a>
            </div>
            <div className={styles['foot__track']}>
              <input type="text" placeholder="Order ID · e.g. P2P-4821" aria-label="Track your order by ID" />
              <button type="button">Track</button>
            </div>
          </div>

          <nav className={styles['foot__links']} aria-label="Footer">
            <div className={styles.lcol}>
              <div className={styles['lcol__title']}>Products</div>
              <a href="#">Magnets</a>
              <a href="#">Keychains</a>
              <a href="#">Acrylic</a>
              <a href="#">Everything else</a>
            </div>
            <div className={styles.lcol}>
              <div className={styles['lcol__title']}>Studio</div>
              <a href="#">How it works</a>
              <a href="#">Bulk &amp; corporate gifts</a>
              <a href="#">Track your order</a>
              <a href="#">Print quality &amp; DPI</a>
            </div>
          </nav>

          <div className={styles['foot__base']}>
            <div className={styles['foot__legal']}>
              <a href="#">Terms</a><span className={styles.sep}>·</span>
              <a href="#">Privacy</a><span className={styles.sep}>·</span>
              <a href="#">Refunds &amp; shipping</a>
            </div>
            <div className={styles['foot__copy']}>© 2026 Pix2Prints. <span className={styles.made}>Printed &amp; shipped from Mumbai.</span></div>
          </div>
        </footer>
      </main>
    </div>
  )
}
