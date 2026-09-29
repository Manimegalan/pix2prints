const ICONS = { success: '✓', error: '✕', loading: '⋯', default: '' }

/* Bottom toast. Stays mounted (CSS animates opacity); `toast` is null
   when hidden, otherwise { message, type }. */
export default function Toast({ toast }) {
  const type = toast?.type || 'default'
  const className = toast ? 'show' + (type !== 'default' ? ' ' + type : '') : ''

  return (
    <div id="toast" className={className}>
      <span className="ic">{ICONS[type] || ''}</span>
      <span className="msg">{toast?.message || ''}</span>
    </div>
  )
}
