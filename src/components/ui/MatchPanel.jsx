export default function MatchPanel({ status, mode, playerColor, hintsOn, historyLength, paletteName, aiDifficulty, gameTime }) {
  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const entries = [
    ['Mode', mode === 'ai' ? 'AI' : mode === 'online' ? 'Online' : 'Local'], ['AI', mode === 'ai' ? aiDifficulty : 'N/A'],
    ['Your side', mode === 'ai' ? (playerColor === 'w' ? 'White' : 'Black') : mode === 'online' ? 'Assigned' : 'Both'],
    ['Hints', hintsOn ? 'On' : 'Off'], ['Moves', historyLength], ['Time', formattedTime], ['Colors', paletteName],
  ];
  return <section className="match-panel-top"><div className="status-row"><span className="status-label">State</span><strong>{status}</strong></div><div className="meta-grid">{entries.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>;
}
