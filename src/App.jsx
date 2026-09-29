import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Catalog from './pages/Catalog.jsx'

// Code-split by route: the catalog (landing page) loads first; the editor and
// preview bundles are fetched only when those routes are opened.
const Editor = lazy(() => import('./pages/Editor.jsx'))
const Preview = lazy(() => import('./pages/Preview.jsx'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="*" element={<Catalog />} />
      </Routes>
    </Suspense>
  )
}
