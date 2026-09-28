# Functional Specification Document (FSD)

**Product:** ReFrame — Image Resize & Aspect Ratio Tool
**Version:** 1.0

---

## 1. Primary User Flow

1. User lands on the page → sees one prominent upload area
2. User selects a photo (file picker, drag-drop, or mobile camera roll/camera)
3. Image loads into the editor, EXIF orientation auto-corrected
4. User picks an aspect ratio preset (or custom) → crop box updates, draggable/resizable
5. User optionally adjusts stretch X/Y, brightness, contrast — all update live
6. User taps **Download** → picks format + quality → file saves to device
7. User can **Reset** or upload another photo to start over

## 2. Feature Specifications

### 2.1 Image Upload
- Accepted formats: JPEG, PNG, WebP, HEIC (with conversion or a clear "not supported yet" message if conversion isn't feasible)
- Soft file-size cap (suggest 25MB) — show a warning above that, since very large files slow down in-browser processing
- Mobile: use `<input type="file" accept="image/*" capture>` to trigger native camera roll / camera
- **Error states:** invalid file type, corrupted file, file too large

### 2.2 Aspect Ratio Presets
- Presets: 1:1 (square), 4:5 (portrait post), 9:16 (story/reel), 16:9 (landscape/thumbnail), 3:4
- Custom: user enters a W:H ratio, or freeform (no lock)
- Selecting a preset resizes/repositions the crop overlay to match; underlying image is untouched until export

### 2.3 Crop
- Draggable, resizable crop box over the image
- Ratio-locked when a preset is active; free-form under "Custom"
- Drag inside the box to reposition; drag corner/edge handles to resize
- "Reset crop" reverts to full image

### 2.4 Resize (Output Dimensions)
- Enter exact output width/height in pixels, or choose a % scale (e.g., 50/75/100/150%)
- Show an estimated output file size near the download action

### 2.5 Stretch (Independent X/Y)
- Two separate controls for horizontal and vertical scale (e.g., 50%–200% each), independent of the aspect-ratio-locked resize
- Clearly labeled as distorting the image (this is intentionally non-uniform scaling, different from a normal resize) so users don't confuse it with cropping
- Live preview as the user drags

### 2.6 Brightness & Contrast
- Two sliders, range −100 to +100 (0 = unchanged)
- Real-time preview; final values baked into the canvas output only at export time
- "Reset adjustments" clears both back to 0

### 2.7 Export / Download
- Format choice: JPEG (quality slider 1–100), PNG (lossless, no quality slider), WebP (quality slider)
- Auto-generated filename, e.g. `reframe_1080x1350.jpg`
- Triggers a native browser download via Blob + `<a download>` — no server round-trip

### 2.8 Undo / Reset
- "Reset" button reverts every edit back to the original uploaded image
- Undo-last-action stack is a nice-to-have, not required for v1

## 3. Edge Cases & Error Handling

| Scenario | Expected behavior |
|---|---|
| Very large image (e.g. 40MP) | Show a loading indicator; consider a downscaled preview with full-res processing only at export time |
| Unsupported format (e.g. RAW, unconverted HEIC) | Clear, friendly error message with guidance |
| Extreme upscaling requested | Warn the user about visible quality loss |
| Device rotation mid-edit | Preserve editor state, re-layout responsively |
| No Canvas API support (very rare/old browser) | Fallback message explaining the browser isn't supported |

## 4. Performance Expectations

- Slider-driven preview updates should feel instant (perceived <100ms); debounce the heavier final-quality recompute
- Large-image export may show a brief "Processing…" state — this is expected and should be communicated, not hidden
