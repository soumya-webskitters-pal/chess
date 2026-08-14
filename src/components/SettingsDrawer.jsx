import { useMemo } from 'react';

const paletteOptions = [
  { value: 'classic', label: 'Black / White' },
  { value: 'gold', label: 'Golden / Silver' },
  { value: 'neon', label: 'Neon Green / Halogen Pink' },
];

export default function SettingsDrawer({ settings, onChange, onClose }) {
  const modeLabel = useMemo(
    () => (settings.mode === 'ai' ? 'VS AI' : 'Two Player'),
    [settings.mode],
  );

  return (
    <div className="settings-overlay" onClick={onClose}>
      <aside className="settings-drawer glass-panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <h3>Game Settings</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-list">
          <label>
            <span>Game mode</span>
            <select value={settings.mode} onChange={(event) => onChange('mode', event.target.value)}>
              <option value="ai">Vs AI</option>
              <option value="local">Two Player</option>
            </select>
          </label>

          {settings.mode === 'ai' && (
            <label>
              <span>AI difficulty</span>
              <select value={settings.aiDifficulty || 'easy'} onChange={(event) => onChange('aiDifficulty', event.target.value)}>
                <option value="easy">Easy</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          )}

          <label className="toggle-row">
            <span>Show hints</span>
            <input type="checkbox" checked={settings.showHints} onChange={(event) => onChange('showHints', event.target.checked)} />
          </label>

          <label className="toggle-row">
            <span>Show possible moves</span>
            <input type="checkbox" checked={settings.showPossibleMoves} onChange={(event) => onChange('showPossibleMoves', event.target.checked)} />
          </label>

          <label className="toggle-row">
            <span>Show grid numbers</span>
            <input type="checkbox" checked={settings.showGridNumbers} onChange={(event) => onChange('showGridNumbers', event.target.checked)} />
          </label>

          <label className="toggle-row">
            <span>Can undo moves</span>
            <input type="checkbox" checked={settings.enableUndo} onChange={(event) => onChange('enableUndo', event.target.checked)} />
          </label>

          <label>
            <span>Piece colors</span>
            <select value={settings.palette} onChange={(event) => onChange('palette', event.target.value)}>
              {paletteOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="settings-summary">
            <span>Active</span>
            <strong>{modeLabel}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
