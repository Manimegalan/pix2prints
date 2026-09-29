import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   Collection store — the composed prints waiting to be uploaded.
   ---------------------------------------------------------------------------
   Deliberately in-memory only (no localStorage): each item holds a full
   300-DPI PNG blob, which would quickly blow past browser storage limits.
   A refresh clears the collection, which is the accepted trade-off.

   Each item: { id, product, geometry, dpi, blob, url } where `url` is an
   object URL for the carousel thumbnail (revoked on remove/clear).
   ═══════════════════════════════════════════════════════════════════════════ */

const CollectionContext = createContext(null)

export function CollectionProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = useCallback((item) => setItems((prev) => [...prev, item]), [])

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const found = prev.find((it) => it.id === id)
      if (found?.url) URL.revokeObjectURL(found.url)
      return prev.filter((it) => it.id !== id)
    })
  }, [])

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.url && URL.revokeObjectURL(it.url))
      return []
    })
  }, [])

  const value = useMemo(
    () => ({ items, count: items.length, addItem, removeItem, clear }),
    [items, addItem, removeItem, clear],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used within a CollectionProvider')
  return ctx
}
