/* ═══════════════════════════════════════════════════════════════════════════
   Editor geometry — pure functions, no DOM, no React.
   ---------------------------------------------------------------------------
   Everything the editor needs to know about *shape and size* is derived here,
   so the components and hooks can stay focused on rendering and interaction.

   Two coordinate worlds exist and this file is the bridge between them:
     • Screen px  — how big the frame is drawn inside the stage well.
     • Print px   — the real 300-DPI pixel size we export and upload.
   ═══════════════════════════════════════════════════════════════════════════ */

export const MM_PER_INCH = 25.4

/**
 * Fixed facts about a product's frame, independent of screen size.
 * A two-sided product (rect + quantity 2) is drawn as two side-by-side slots.
 */
export function deriveGeometry(product) {
  const isCircle = product.shape === 'circle'
  const photoCount = product.shape === 'rect' && product.quantity === 2 ? 2 : 1

  const frameWmm = isCircle ? product.diameterMm : product.widthMm
  const frameHmm = isCircle ? product.diameterMm : product.heightMm

  return {
    isCircle,
    photoCount,
    isTwoSided: photoCount === 2,
    frameWmm,
    frameHmm,
    slotWmm: frameWmm / photoCount, // width of one slot in mm
  }
}

/**
 * Fit the frame into the available well area, preserving aspect ratio.
 * Returns the on-screen pixel size of the frame and of a single slot.
 */
export function fitFrameToWell(geometry, wellWidth, wellHeight, pad = 20) {
  const availW = Math.max(0, wellWidth - pad * 2)
  const availH = Math.max(0, wellHeight - pad * 2)
  const aspect = geometry.frameWmm / geometry.frameHmm

  let frameW
  let frameH
  if (availH > 0 && availW / availH > aspect) {
    frameH = availH
    frameW = Math.round(frameH * aspect)
  } else {
    frameW = availW
    frameH = Math.round(frameW / aspect)
  }

  return {
    frameW,
    frameH,
    slotW: geometry.isTwoSided ? Math.round(frameW / 2) : frameW,
  }
}

/**
 * Cover-fit baseline: the size an image is drawn at before the user's own
 * scale/pan/rotate is applied, so it fully covers the slot at scale 1.
 * `naturalAspect` is the image's natural width / height.
 */
export function coverFitBaseline(naturalAspect, slotW, slotH) {
  const slotAspect = slotW / slotH
  if (naturalAspect > slotAspect) {
    return { baseW: slotH * naturalAspect, baseH: slotH }
  }
  return { baseW: slotW, baseH: slotW / naturalAspect }
}

/** Print-resolution pixel sizes for the export canvas. */
export function exportSize(geometry, dpi) {
  const pxPerMm = dpi / MM_PER_INCH
  const slotW = Math.round(geometry.slotWmm * pxPerMm)
  const slotH = Math.round(geometry.frameHmm * pxPerMm)
  return {
    slotW,
    slotH,
    canvasW: slotW * geometry.photoCount,
    canvasH: slotH,
  }
}
