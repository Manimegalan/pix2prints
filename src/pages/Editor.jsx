import { useSearchParams } from 'react-router-dom'
import CONFIG from '../config.js'
import EditorView from '../editor/EditorView.jsx'
import NotFound from '../editor/components/NotFound.jsx'
import './Editor.css'

/* Thin route component: resolve the product from ?slug and either show the
   editor or the not-found card. Keeping the lookup here (and the hook-heavy
   work in EditorView) means hooks are only ever called for a real product,
   so the rules-of-hooks stay satisfied when the slug changes. */
export default function Editor() {
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug')
  const product = (CONFIG.products || []).find((p) => p.slug === slug)

  if (!product) return <NotFound slug={slug} />
  return <EditorView key={product.slug} product={product} />
}
