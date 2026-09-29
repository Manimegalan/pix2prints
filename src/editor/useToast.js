import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tiny toast controller. `toast` is null when hidden, otherwise
 * { message, type } where type is 'success' | 'error' | 'loading' | 'default'.
 * Pass duration 0 to keep a toast up until the next showToast/hide call.
 */
export function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const showToast = useCallback(
    (message, type = 'default', duration = 3200) => {
      clear()
      setToast({ message, type })
      if (duration > 0) {
        timerRef.current = setTimeout(() => setToast(null), duration)
      }
    },
    [clear],
  )

  const hideToast = useCallback(() => {
    clear()
    setToast(null)
  }, [clear])

  useEffect(() => clear, [clear])

  return { toast, showToast, hideToast }
}
