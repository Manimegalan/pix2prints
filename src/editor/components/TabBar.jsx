/* Bottom tab bar. `TABS` is the single source of which panels exist and in
   what order; Controls renders the body for whichever id is active. */

export const TABS = [
  {
    id: 'pos',
    label: 'Position',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="2.5" />
        <line x1="12" y1="2" x2="12" y2="7" />
        <line x1="12" y1="17" x2="12" y2="22" />
        <line x1="2" y1="12" x2="7" y2="12" />
        <line x1="17" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    id: 'scale',
    label: 'Scale',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    ),
  },
  {
    id: 'rot',
    label: 'Rotate',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21.5 2v6h-6" />
        <path d="M21.34 15.57a10 10 0 11-.57-8.38" />
      </svg>
    ),
  },
  {
    id: 'flip',
    label: 'Flip',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3" />
        <path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'Upload',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </svg>
    ),
  },
]

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <div id="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={'tab-btn' + (activeTab === tab.id ? ' active' : '')}
          type="button"
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
