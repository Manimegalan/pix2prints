import { Routes, Route } from 'react-router-dom'
import Catalog from './pages/Catalog.jsx'
import Editor from './pages/Editor.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="*" element={<Catalog />} />
    </Routes>
  )
}
