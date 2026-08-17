export default function TopBar({ onReset, onUndo, onOpenSettings, onOpenHowToPlay, undoCount, infoExpanded, onToggleInfo, children }) {
  return (
    <header className={`topbar glass-panel${infoExpanded ? ' info-expanded' : ' info-collapsed'}`}>
      <div className="topbar-brand"><p className="eyebrow">Quantum Board</p><div className="title-row">
        <h1>Chess Arena</h1><button className="title-new-match" onClick={onReset}>New match</button><button className="how-to-button" onClick={onOpenHowToPlay}>How to play</button>
      </div></div>
      <div className="topbar-match" id="match-information" aria-hidden={!infoExpanded}>{children}</div>
      <div className="topbar-actions">
        <button className="info-toggle-button" onClick={onToggleInfo} aria-label={infoExpanded ? 'Hide match information' : 'Show match information'} aria-expanded={infoExpanded} aria-controls="match-information">
          <span>Match info</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
        </button>
        <button className="ghost-button undo-button" onClick={onUndo} disabled={undoCount === 0}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M4 12h9a7 7 0 0 1 7 7" /></svg><span>Undo ({undoCount})</span></button>
        <button className="icon-button" aria-label="Open settings" onClick={onOpenSettings}>⚙</button>
      </div>
    </header>
  );
}
