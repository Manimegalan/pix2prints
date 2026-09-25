# Deploying to GitHub Pages (manimegalan.github.io/pix2prints)

Your Pages site is a **project page** (`manimegalan.github.io/pix2prints`),
serving whatever is currently at the root of your `pix2prints` repo's Pages
branch — that's why `vite.config.js` sets `base: '/pix2prints/'` (every
built asset URL is prefixed with the repo name to match).

## One-time: replace the raw HTML files with the build

1. `npm install && npm run build` — this produces `dist/` (already done once
   for you in `dist-ghpages/`, built with the correct base path).
2. In your `pix2prints` repo (the one backing the Pages site), **delete** the
   old raw files: `index.html`, `editor.html`, `config.js`, `catalog.js`,
   `editor.js`. They're superseded by the built app.
3. Copy everything from `dist-ghpages/` (or your own fresh `dist/`) into the
   repo root: `index.html`, `assets/`, `favicon.svg`, `icons.svg`, and
   **`404.html`**.
4. Commit and push. GitHub Pages serves static files as-is, so no build step
   runs on their end — you build locally (or in CI) and push the output,
   same as your original "no build step" workflow, just with a build step
   added before the push.

## Why there's a 404.html

The app has two routes (`/` and `/editor`) handled client-side by
`react-router-dom`. GitHub Pages has no server-side rewrites, so a direct
link or a refresh on `/pix2prints/editor?slug=...` would normally 404 —
Pages looks for a literal `editor` file. GitHub Pages' fallback behavior is
to serve `404.html` for any unmatched path, so `404.html` here is just a
copy of `index.html`: the app boots, sees the URL, and `react-router-dom`
renders the right route. This is the standard trick for SPAs on GitHub
Pages and needs no other configuration.

## Going forward

Every time you change something, repeat: `npm run build`, copy `dist/`'s
contents (plus a fresh `404.html` copy of the new `index.html`) into the
repo root, commit, push.

If you'd rather not do that by hand each time, add a GitHub Actions
workflow that runs `npm run build` and publishes `dist/` automatically on
every push to `main` — say the word and I'll write one, but I can't push it
to your repo myself since I'm not connected to GitHub in this session.
