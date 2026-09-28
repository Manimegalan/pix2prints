# Backend / Database Schema and Models

**Product:** ReFrame — Image Resize & Aspect Ratio Tool
**Version:** 1.0

---

## 1. Architecture Decision

Based on your requirements — **no login, all processing in-browser, free with no monetization** — v1 needs **no traditional backend and no database**. There are no user accounts and no images are ever uploaded, so there's no server-side state to store in the first place.

This isn't a shortcut — it's the correct architecture for what you described: it maximizes privacy (nothing ever leaves the device), minimizes hosting cost (no server compute), and removes an entire category of things that could break or need securing.

## 2. What Infrastructure Actually Exists

| Piece | Purpose |
|---|---|
| Static hosting / CDN | Serves the HTML/CSS/JS bundle only |
| (Optional) one serverless function | Only if you want a feedback/contact form — forwards a message, doesn't need a database |
| (Optional) third-party analytics | Aggregate, privacy-friendly usage stats (e.g. Plausible) — not a custom database |

No user database. No image storage. No authentication system.

## 3. Client-Side "Data Model"

Since there's no backend, the closest thing to a schema lives entirely in the browser, in memory (and, for tiny preference values only, in `localStorage`):

```
EditorState (in-memory, per session — never persisted or transmitted)
├─ sourceImage: { width, height, format, blobUrl }
├─ cropBox: { x, y, width, height, aspectRatioLocked }
├─ transform: { stretchX, stretchY }
├─ adjustments: { brightness, contrast }
└─ exportSettings: { format, quality }

LocalStoragePreferences (persisted, no PII, no image data)
├─ lastUsedAspectRatio: string
├─ lastExportFormat: string
└─ lastExportQuality: number
```

Only lightweight preference values are ever written to `localStorage` — never the image itself — to keep the "nothing leaves your device" promise intact even for stored preferences.

## 4. Future-Proofing (only if requirements change later)

If you ever decide to add *optional* accounts (e.g. "sync my presets across devices"), here's a minimal schema you could grow into without disrupting v1's architecture:

```
User
├─ id (uuid, pk)
├─ email (nullable — e.g. for passwordless/magic-link auth)
└─ created_at

Preset
├─ id (uuid, pk)
├─ user_id (fk → User.id)
├─ name
├─ aspect_ratio
├─ brightness, contrast, stretch_x, stretch_y (default values)
└─ created_at
```

This is **explicitly out of scope for v1** — included only so a future decision doesn't require re-architecting the app.

## 5. API Surface (v1)

None required for the core tool. If you add a feedback form, the only endpoint needed would be:

```
POST /api/feedback
Body:     { message: string, email?: string }
Response: 200 { success: true }
```

## 6. Recommendation

Keep v1 as a pure static site with zero backend. It's cheaper to run, faster to build (nothing to secure or maintain server-side), and genuinely more private — which lines up exactly with what you described wanting.
