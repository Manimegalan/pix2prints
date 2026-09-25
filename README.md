# Pix2Prints — React (Vite)

React + Vite port of the original plain-HTML/JS Pix2Prints storefront and
frame-fit photo editor. Same product config, same 300-DPI export pipeline,
same upload flow — now as componentized routes instead of two separate
HTML pages.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run build` produces a static `dist/`
folder you can deploy anywhere (GitHub Pages, Netlify, S3, etc.) — it's a
client-only SPA with no server requirement beyond serving static files.

## Structure

```
src/
  config.js              Product + app config — the only file you normally edit
  main.jsx               App entry, wraps <App/> in a BrowserRouter
  App.jsx                Routes: "/" → Catalog, "/editor" → Editor
  index.css              Small global reset shared by both pages
  pages/
    Catalog.jsx           Storefront: search, category chips, product grid
    Catalog.module.css    Catalog styles (CSS Modules — scoped classes)
    Editor.jsx            Frame-fit editor: drag/scale/rotate/flip, DPI export, upload
    Editor.css            Editor styles (plain global CSS, see note below)
  components/
    ProductCard.jsx        Product card with its own image carousel
```

Routing replaces the old `index.html` / `editor.html` navigation:
`editor.html?slug=X` is now `/editor?slug=X`, read via
`react-router-dom`'s `useSearchParams`.

## Why Editor.jsx isn't "pure" React

The frame-fit canvas (drag to pan, cover-fit scaling, rotate, flip, live
guides, 300-DPI canvas export) is perf-sensitive and was already correct as
plain DOM/canvas code. `Editor.jsx` renders the static shell as JSX, then an
effect ports the original `editor.js` logic almost line-for-line against
that DOM (refs/ids), with an `AbortController` cleaning up every listener
when you navigate away. This keeps the exact drag physics and export math
from the original, while everything else (routing, the catalog, config) is
idiomatic React. `Editor.css` is intentionally a plain (non-module)
stylesheet so that script can keep using plain class-name strings; `Catalog`
uses CSS Modules since it's fully React-driven.

## Configure

Everything product- and environment-specific lives in `src/config.js`:

- **Upload endpoint** — `app.uploadEndpoint`. Must be an **`https://`** URL.
- **Products** — add/remove entries in `products`. Adding a product is a
  config change only; no component changes needed.

## What the backend must do

Same contract as the original: the editor POSTs `multipart/form-data` with a
`file` (PNG named `{name-slug}_{mobile}_{product-slug}_{timestamp}.png`),
product/print metadata (`product_slug`, `shape`, `quantity`, `dpi`,
`diameter_mm` or `width_mm`+`height_mm`, `px_width`, `px_height`), and
customer details (`customer_name`, `customer_mobile`). The endpoint must
return HTTP 200 on success and send `Access-Control-Allow-Origin` for your
deployed origin (or `*`).

## Notes / known limits (unchanged from v1)

- Background fill for exposed print areas is white (opaque), by design.
- Single upload attempt — on error, the customer can press upload again.
- EXIF orientation is not normalized (browser default).
- iOS/Safari/HEIC and in-app camera capture are out of scope.
- `assets/previews/*.svg` referenced in `config.js` were not present in the
  original project either — add them if you want product preview art.
