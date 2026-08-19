# Pix2Prints — v1

A mobile-first, dependency-free storefront + frame-fit photo editor. A customer
picks a product, fits their photo into that product's exact print area, enters
their name and mobile number, and the app renders a print-ready PNG at 300 DPI
and uploads it — with the metadata — to a configured endpoint.

Plain HTML/CSS/JS. No framework, no bundler, no build step.

## Files

```
index.html    Storefront shell (markup + styles)
editor.html   Editor shell (markup + styles)
config.js     Central product + app config  ← the only file you normally edit
catalog.js    Renders the storefront grid from config
editor.js     Editor logic: frame-fit, 300-DPI export, upload
assets/previews/*.svg   Product preview tiles referenced by config
```

## Run locally

Just open `index.html` in a modern browser (Chrome is the reference). The config
loads as a plain global script, so it works over `file://` as well as `https://`
— no local server needed. Reference platform is Android Chrome.

## Configure

Everything product- and environment-specific lives in `config.js`:

- **Upload endpoint** — `PIX2PRINTS.app.uploadEndpoint`. Must be an **`https://`**
  URL (GitHub Pages is HTTPS and a page cannot POST to `http://` — the browser
  blocks it). The placeholder `https://api.example.com/uploads` will return a
  network/CORS error until you point it at a real endpoint; that's expected.
- **Products** — add/remove entries in `PIX2PRINTS.products`. Adding a product is
  a config change only; no storefront or editor code changes. Each entry:
  `slug, name, subtitle?, category, shape ("circle"|"rect"), diameterMm | widthMm+heightMm, quantity (1 or 2 for split, rect only), preview, description?`.

## Deploy (GitHub Pages)

Push these files to the Pages branch/folder. All links are **relative**, so it
works from a project subpath (`https://<user>.github.io/<repo>/`). No build step.

## What the backend must do

The editor sends a **`multipart/form-data` POST** (no custom headers) with:

| field | notes |
|---|---|
| `file` | the PNG, named `{name-slug}_{mobile}_{product-slug}_{YYYYMMDD-HHmmss}.png` |
| `product_slug`, `product_name`, `shape`, `quantity`, `dpi` | from config |
| `diameter_mm` *(circle)* or `width_mm` + `height_mm` *(rect)* | physical size; `width_mm` is the overall item width |
| `px_width`, `px_height` | exported canvas pixel size |
| `customer_name`, `customer_mobile` | mobile is a normalized 10-digit number |

The endpoint must return **HTTP 200 on success** (anything else is treated as a
failure) and send **`Access-Control-Allow-Origin`** for the Pages origin (or `*`).
The uploaded PNG is always a full rectangle; circle and split cuts happen
physically at production.

## Notes / known v1 limits

- Background fill for exposed areas is **white** (opaque), by design.
- Single upload attempt — on error, the customer can press upload again.
- EXIF orientation is not normalized (browser default) — watch during Android QA.
- iOS/Safari/HEIC and in-app camera capture are out of scope for v1.
