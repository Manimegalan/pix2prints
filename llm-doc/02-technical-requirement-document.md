# Technical Requirement Document (TRD)

**Product:** ReFrame — Image Resize & Aspect Ratio Tool
**Version:** 1.0

---

## 1. Architecture Overview

ReFrame is a **static, client-side-only single-page web app**. There is no application server for the core feature set — every image operation (crop, resize, stretch, brightness/contrast) runs in the user's browser via the Canvas API. The app is served as static files from a CDN.

```
User's Browser
  └─ Loads static SPA (HTML/CSS/JS bundle)
  └─ User selects a local image (never leaves the device)
  └─ Canvas / Web Worker processes the image in memory
  └─ User downloads the processed image directly to their device
```

No network round-trip happens in the core editing flow — this is what makes the "no login, no upload, private" promise actually true, not just a marketing line.

## 2. Recommended Tech Stack

| Layer | Recommendation | Why |
|---|---|---|
| Framework | React + Vite (or Next.js static export) | Fast dev loop, huge ecosystem, AI coding tools work well with it |
| Styling | Tailwind CSS | Consistent design tokens, fast to iterate with AI-assisted coding |
| Image processing | Canvas 2D API, optionally OffscreenCanvas + Web Worker for large images | Sufficient for crop/resize/stretch/brightness/contrast; keeps UI thread responsive |
| State | React state / `useReducer` | App logic is simple enough — no need for Redux/Zustand |
| Local persistence | `localStorage` (preferences only, never image data) | Remember last-used aspect ratio/format without compromising privacy |
| Hosting | Vercel / Netlify / Cloudflare Pages | Static hosting, near-zero cost, optional serverless functions if needed later |
| Analytics (optional) | Plausible or Simple Analytics | Cookie-less, privacy-respecting, fits the no-login positioning |

> Since you have no stack preference, this combination was chosen specifically because it's well-documented and heavily represented in AI coding tools' training data — meaning tools like Claude Code will generate more reliable code for it.

## 3. Non-Functional Requirements

- **Performance:** initial load under 2s on 4G mobile; processing under ~1s for images up to ~12MP on a mid-range phone
- **Browser support:** latest 2 versions of Chrome, Safari (incl. iOS), Firefox, Edge
- **Responsiveness:** mobile-first; breakpoints at 375 / 768 / 1024 / 1440px
- **Accessibility:** aim for WCAG 2.1 AA — keyboard-operable sliders, sufficient contrast, aria-labels on icon-only controls
- **Privacy:** no image data is ever transmitted over the network
- **Offline (nice-to-have):** consider a PWA wrapper so the tool works after first load with no connection

## 4. Image Handling Details

- **EXIF orientation:** mobile photos frequently carry EXIF rotation metadata — must be read and corrected before rendering to canvas, or images will appear sideways/upside-down
- **Input formats:** JPEG, PNG, WebP. **HEIC needs special handling** — browsers don't natively decode HEIC well (notably iOS Safari can display but not always reliably decode via Canvas), so plan for a small HEIC→JPEG conversion step or a clear "unsupported format" message
- **Output formats:** JPEG (adjustable quality), PNG (lossless), WebP (adjustable quality)

## 5. Security Considerations

- No image upload means the main attack surface is the client bundle itself — keep third-party dependencies minimal and patched
- No cookies/auth tokens to protect, since there's no login

## 6. Scalability

- Because all compute is client-side, the server side is just static file serving — this scales trivially and cheaply regardless of traffic volume

## 7. Key Browser APIs Relied On

- `Canvas` / `OffscreenCanvas`
- `File` / `FileReader` / `Blob`
- `URL.createObjectURL`
- Web Workers (for large-image processing without blocking the UI)
- A small EXIF-reading utility (e.g. a lightweight library) for orientation correction

## 8. Deployment

- Single static build, deployed to a CDN-backed host (Vercel/Netlify/Cloudflare Pages all work)
- No environment secrets or server config required for v1, since there is no backend beyond static hosting
