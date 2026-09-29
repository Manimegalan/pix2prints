import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Catalog from './pages/Catalog.jsx'

// Code-split the editor: the catalog (landing page) loads first, and the
// editor's larger bundle is fetched only when a product is opened.
const Editor = lazy(() => import('./pages/Editor.jsx'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="*" element={<Catalog />} />
      </Routes>
    </Suspense>
  )
}
