/* ═══════════════════════════════════════════════════════════════════════════
   Small pure helpers for the customer-details form and the export filename.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Validate and normalise an Indian mobile number.
 * Accepts spaces, dashes, brackets, and an optional +91 / 0091 / 0 prefix.
 * Returns the bare 10-digit number, or null if it isn't valid.
 */
export function normalizeMobile(raw) {
  const cleaned = String(raw).replace(/[\s\-()]/g, '')
  if (!/^(?:\+?91|0091|0)?[6-9]\d{9}$/.test(cleaned)) return null
  return cleaned.replace(/^(?:\+?91|0091|0)/, '')
}

/** Turn a name into a filename-safe slug. */
export function slugifyName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Compact YYYYMMDD-HHMMSS timestamp for filenames. */
export function timestamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return (
    date.getFullYear() +
    p(date.getMonth() + 1) +
    p(date.getDate()) +
    '-' +
    p(date.getHours()) +
    p(date.getMinutes()) +
    p(date.getSeconds())
  )
}
