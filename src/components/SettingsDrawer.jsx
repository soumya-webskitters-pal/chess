import { useEffect, useMemo, useRef, useState } from 'react';

const paletteOptions = [
  { value: 'classic', label: 'Classic' },
  { value: 'gold', label: 'Golden' },
  { value: 'neon', label: 'Neon' },
];

function CustomSelect({ value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  return (
    <div className={`custom-select${open ? ' is-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected.label}</span>
        <span className="select-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="custom-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`custom-select-option${option.value === value ? ' is-selected' : ''}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsDrawer({ settings, onChange, onClose }) {
  const modeLabel = useMemo(
    () => (settings.mode === 'ai' ? 'VS AI' : 'Two Player'),
    [settings.mode],
  );

  return (
    <div className="settings-overlay" onClick={onClose}>
      <aside className="settings-drawer glass-panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="drawer-eyebrow">Preferences</p>
            <h3>Game Settings</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-list">
          <div className="setting-field">
            <span>Game mode</span>
            <CustomSelect
              value={settings.mode}
              options={[{ value: 'ai', label: 'Vs AI' }, { value: 'local', label: 'Two Player' }]}
              onChange={(value) => onChange('mode', value)}
              ariaLabel="Game mode"
            />
          </div>

          {settings.mode === 'ai' && (
            <>
              <div className="setting-field">
                <span>Play as</span>
                <CustomSelect
                  value={settings.playerColor || 'w'}
                  options={[{ value: 'w', label: 'White' }, { value: 'b', label: 'Black' }]}
                  onChange={(value) => onChange('playerColor', value)}
                  ariaLabel="Play as"
                />
              </div>

              <div className="setting-field">
                <span>AI difficulty</span>
                <CustomSelect
                  value={settings.aiDifficulty || 'easy'}
                  options={[{ value: 'easy', label: 'Easy' }, { value: 'hard', label: 'Hard' }]}
                  onChange={(value) => onChange('aiDifficulty', value)}
                  ariaLabel="AI difficulty"
                />
              </div>
            </>
          )}

          <label className="toggle-row">
            <span>Show hints</span>
            <span className="toggle-control">
              <input type="checkbox" checked={settings.showHints} onChange={(event) => onChange('showHints', event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
            </span>
          </label>

          <label className="toggle-row">
            <span>Show possible moves</span>
            <span className="toggle-control">
              <input type="checkbox" checked={settings.showPossibleMoves} onChange={(event) => onChange('showPossibleMoves', event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
            </span>
          </label>

          <label className="toggle-row">
            <span>Show grid numbers</span>
            <span className="toggle-control">
              <input type="checkbox" checked={settings.showGridNumbers} onChange={(event) => onChange('showGridNumbers', event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
            </span>
          </label>

          <label className="toggle-row">
            <span>Can undo moves</span>
            <span className="toggle-control">
              <input type="checkbox" checked={settings.enableUndo} onChange={(event) => onChange('enableUndo', event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
            </span>
          </label>

          <div className="setting-field">
            <span>Piece colors</span>
            <CustomSelect
              value={settings.palette}
              options={paletteOptions}
              onChange={(value) => onChange('palette', value)}
              ariaLabel="Piece colors"
            />
          </div>

          <div className="settings-summary">
            <span>Active</span>
            <strong>{modeLabel}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
