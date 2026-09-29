/* Grid / center-cross toggles plus the "photo loaded" status readout. */
export default function GuideBar({ gridOn, crossOn, onToggleGrid, onToggleCross, statusOn, statusLabel }) {
  return (
    <div id="guide-bar">
      <button
        className={'guide-btn' + (gridOn ? ' active' : '')}
        type="button"
        aria-pressed={gridOn}
        onClick={onToggleGrid}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x=".75" y=".75" width="12.5" height="12.5" rx="1" />
          <line x1="4.67" y1=".75" x2="4.67" y2="13.25" />
          <line x1="9.33" y1=".75" x2="9.33" y2="13.25" />
          <line x1=".75" y1="4.67" x2="13.25" y2="4.67" />
          <line x1=".75" y1="9.33" x2="13.25" y2="9.33" />
        </svg>
        Grid
      </button>

      <button
        className={'guide-btn' + (crossOn ? ' active' : '')}
        type="button"
        aria-pressed={crossOn}
        onClick={onToggleCross}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="7" y1="1" x2="7" y2="13" />
          <line x1="1" y1="7" x2="13" y2="7" />
          <circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        Center
      </button>

      <span className="guide-spacer" />
      <span className="img-status">
        <span className={'dot' + (statusOn ? ' on' : '')} />
        <span className="nm">{statusLabel}</span>
      </span>
    </div>
  )
}
