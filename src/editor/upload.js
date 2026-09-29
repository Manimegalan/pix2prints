/* ═══════════════════════════════════════════════════════════════════════════
   Upload — build the print filename + multipart body and POST it.
   Kept separate so the network/format details don't clutter the UI code.
   ═══════════════════════════════════════════════════════════════════════════ */
import { exportSize } from './geometry.js'
import { slugifyName, timestamp } from './validation.js'

export function buildFileName(customer, product) {
  return (
    slugifyName(customer.name) +
    '_' +
    customer.mobile +
    '_' +
    product.slug +
    '_' +
    timestamp() +
    '.png'
  )
}

/**
 * POST the rendered print file plus order metadata to the upload endpoint.
 * @returns {Promise<Response>}
 */
export function uploadPrint({ endpoint, blob, product, geometry, customer, dpi }) {
  const { canvasW, canvasH } = exportSize(geometry, dpi)
  const fd = new FormData()

  fd.append('file', blob, buildFileName(customer, product))
  fd.append('product_slug', product.slug)
  fd.append('product_name', product.name)
  fd.append('shape', product.shape)
  fd.append('quantity', String(geometry.photoCount))

  if (geometry.isCircle) {
    fd.append('diameter_mm', String(product.diameterMm))
  } else {
    fd.append('width_mm', String(geometry.frameWmm))
    fd.append('height_mm', String(geometry.frameHmm))
  }

  fd.append('px_width', String(canvasW))
  fd.append('px_height', String(canvasH))
  fd.append('dpi', String(dpi))
  fd.append('customer_name', customer.name)
  fd.append('customer_mobile', customer.mobile)

  return fetch(endpoint, { method: 'POST', body: fd })
}
