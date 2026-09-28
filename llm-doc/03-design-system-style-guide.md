# Design System / Style Guide

**Product:** ReFrame — Image Resize & Aspect Ratio Tool
**Version:** 1.0

---

## 1. Brand Principles

- **Fast** — no onboarding, no login screen, straight into the tool
- **Simple** — one clear task at a time, no feature clutter
- **Trustworthy** — visually communicate "your photo stays on your device"

## 2. Color Palette

> Replace hex values with your actual brand colors — these are sensible placeholder defaults.

| Role | Color | Hex |
|---|---|---|
| Primary (brand/CTA) | Teal/blue | `#0EA5A0` |
| Primary hover | Darker teal | `#0B857F` |
| Background | Off-white | `#FAFAFA` |
| Surface (cards/panels) | White | `#FFFFFF` |
| Text primary | Near-black | `#1A1A1A` |
| Text secondary | Mid gray | `#6B7280` |
| Border/divider | Light gray | `#E5E7EB` |
| Success | Green | `#16A34A` |
| Error | Red | `#DC2626` |

## 3. Typography

- **Font:** system font stack (`-apple-system, "Segoe UI", Roboto, sans-serif`) or Inter — fast-loading, native feel, no font-loading flash
- **Scale:**
  - H1: 28px / bold (screen titles — rarely needed, this is a single-screen tool)
  - H2: 20px / semibold (section labels: "Aspect Ratio", "Adjustments")
  - Body: 16px / regular
  - Caption/labels: 13px / medium (slider labels, helper text)

## 4. Spacing & Layout

- 8px base spacing unit (8 / 16 / 24 / 32...)
- Mobile-first, single-column layout
- Desktop: cap the tool's content width at ~700–800px — this is a utility, not a marketing page; don't stretch controls across a wide desktop screen

## 5. Core Components

| Component | Notes |
|---|---|
| Upload dropzone | Large tap target, clear icon + "Tap to upload or drag a photo" |
| Aspect ratio chips | Pill-style toggle buttons: 1:1, 4:5, 9:16, 16:9, 3:4, Custom |
| Crop canvas | Draggable box with corner + edge handles, min handle hit-area 44×44px |
| Sliders | Resize %, Stretch X, Stretch Y, Brightness, Contrast — always show the numeric value next to the slider |
| Format/quality selector | Segmented control for JPEG/PNG/WebP + quality slider (hidden for PNG) |
| Primary CTA | "Download" button — highest visual weight, primary color, always reachable without scrolling on mobile (sticky bottom bar recommended) |
| Secondary action | "Reset" — lower visual weight (ghost/text button) |
| Toast/snackbar | Brief confirmation, e.g. "Downloaded ✓" |

## 6. Interaction Patterns

- **Live preview:** brightness/contrast/stretch update the image in real time as the slider moves — no "Apply" button
- **Touch gestures:** pinch-to-zoom and drag-to-reposition inside the crop area; drag handles to resize the crop box
- **Debounce heavy recompute** (e.g., final pixel processing) slightly behind the visual slider movement, so low-end phones don't stutter

## 7. Accessibility

- Minimum tap target: 44×44px
- Text contrast ratio ≥ 4.5:1
- All sliders operable via keyboard (arrow keys)
- Icon-only buttons get `aria-label`s
- Focus states clearly visible for keyboard users
