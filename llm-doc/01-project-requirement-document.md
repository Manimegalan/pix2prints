# Project Requirement Document (PRD)

**Product (working title):** ReFrame — Image Resize & Aspect Ratio Tool
**Version:** 1.0
**Date:** August 2026
**Status:** Draft

> The working title "ReFrame" is a placeholder — swap it throughout these docs once you pick a name.

---

## 1. Executive Summary

ReFrame is a free, mobile-first web app that lets anyone resize a photo to a different aspect ratio and make basic adjustments (crop, resize, independent X/Y stretch, brightness/contrast) — entirely in the browser, with no login and no image ever uploaded to a server.

## 2. Problem Statement

People constantly need to reshape the same photo for different destinations — an Instagram post, a story, a WhatsApp DP, a YouTube thumbnail, a print size. Existing tools are either:

- Too heavy (Photoshop, Lightroom) for a 30-second task, or
- Require an account and an upload to a server (privacy concern, slower, needs internet round-trip)

There's room for a tool that's instant, free, and keeps the image on the user's device the whole time.

## 3. Goals & Objectives

- Let anyone resize/reshape a photo in under a minute, with zero setup
- No login, no upload — the image never leaves the device
- Mobile-first experience, since most casual photo editing happens on phones
- Zero cost to the user (no ads, no paywall, per your preference)

## 4. Target Audience

- Everyday social media users resizing photos for different platforms
- Small business owners / freelancers prepping product or listing photos
- Students, casual users needing a quick one-off edit
- Assume majority mobile traffic (~70–80%)

## 5. Scope — v1 ("fairly complete first version")

**In scope:**
- Image upload: file picker, drag-and-drop (desktop), camera roll / camera capture (mobile)
- Aspect ratio presets (1:1, 4:5, 9:16, 16:9, 3:4) + custom ratio
- Interactive crop (ratio-locked and free-form)
- Resize by exact pixel dimensions or percentage
- Independent X/Y stretch
- Brightness & contrast adjustment
- Export as JPEG / PNG / WebP with quality control
- Fully responsive, mobile-first UI
- No login, no server-side storage of any kind

**Out of scope for v1:**
- Accounts, cross-device saved history/presets
- Batch processing (multiple images at once)
- Filters, AI-based enhancement, background removal
- Server-side image processing
- Native iOS/Android apps (web only)

## 6. Key Features (summary)

| Feature | Description |
|---|---|
| Upload | File picker / drag-drop / mobile camera roll |
| Aspect ratio presets | 1:1, 4:5, 9:16, 16:9, 3:4, custom |
| Crop | Draggable, resizable crop box, ratio-locked or free |
| Resize | Exact pixels or % scale |
| Stretch X/Y | Independent horizontal/vertical scaling |
| Brightness/Contrast | Real-time sliders |
| Export | JPEG/PNG/WebP with quality slider |

## 7. Success Metrics

- % of sessions that end in a completed download
- Median time from upload to first download
- Mobile vs. desktop usage split
- Bounce rate on landing
- Repeat/return visits (via privacy-friendly, cookie-less analytics — no login means no per-user tracking)

## 8. Assumptions & Constraints

- Users are on a reasonably modern browser (Canvas API support required)
- No backend/DB means no cross-device history unless you add optional accounts later (see Backend doc)
- "Free, no monetization" means hosting cost should stay near-zero — client-side processing supports this, since there's no server-side compute cost

## 9. Risks

- Large images (e.g., 40MP phone photos) may strain low-end device performance during in-browser processing
- iOS Safari has known quirks with Canvas, EXIF orientation, and HEIC decoding — needs explicit handling (see TRD)
- No monetization means the project needs to be cheap enough to run indefinitely without revenue

## 10. Rough Milestones

1. **M1** — Upload + crop + aspect ratio presets
2. **M2** — Resize + independent X/Y stretch
3. **M3** — Brightness/contrast + export options (format + quality)
4. **M4** — Cross-device/browser QA, performance tuning on low-end mobile
5. **M5** — Launch
