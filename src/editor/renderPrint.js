/* ═══════════════════════════════════════════════════════════════════════════
   Print export — draws the final 300-DPI PNG on an offscreen canvas.
   ---------------------------------------------------------------------------
   This is the heaviest, least-often-used part of the editor, so Editor.jsx
   pulls it in with a dynamic import() only when the user actually uploads.
   That keeps the canvas/export code out of the initial page bundle.

   The math mirrors the live preview exactly: same cover-fit baseline, same
   pan / scale / rotate / flip transform — just at print resolution and
   clipped per slot instead of via CSS overflow.
   ═══════════════════════════════════════════════════════════════════════════ */
import { coverFitBaseline, exportSize } from './geometry.js'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (img.complete && img.src) resolve(img)
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Render all frames to a print-ready PNG.
 * @returns {Promise<Blob>}
 */
export async function renderPrint({ frames, geometry, dpi }) {
  const { slotW, slotH, canvasW, canvasH } = exportSize(geometry, dpi)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvasW, canvasH)

  for (let i = 0; i < geometry.photoCount; i++) {
    const frame = frames[i]
    const xOffset = i * slotW

    // eslint-disable-next-line no-await-in-loop
    const img = await loadImage(frame.imgSrc)
    const { baseW, baseH } = coverFitBaseline(frame.naturalAspect, slotW, slotH)

    ctx.save()
    ctx.beginPath()
    ctx.rect(xOffset, 0, slotW, slotH)
    ctx.clip()
    ctx.translate(xOffset + slotW / 2, slotH / 2)
    ctx.translate(frame.offsetX * slotW, frame.offsetY * slotH)
    ctx.rotate((frame.rotation * Math.PI) / 180)
    ctx.scale(
      frame.scaleW * (frame.flipH ? -1 : 1),
      frame.scaleH * (frame.flipV ? -1 : 1),
    )
    ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH)
    ctx.restore()
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
