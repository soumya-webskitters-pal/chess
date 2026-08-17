export default function MoveHistoryPanel({ moveHistory, onClose }) {
  return <aside className="move-history-panel glass-panel"><div className="move-log">
    <div className="move-log-header"><h4>Move History</h4><div className="move-history-header-actions"><span>{moveHistory.length}</span><button className="move-history-close" onClick={onClose} aria-label="Close move history">✕</button></div></div>
    <div className="move-log-list">{moveHistory.length === 0 ? <p className="move-log-empty">No moves yet</p> : moveHistory.map((move, index) => <div className="move-log-item" key={`${move.from}-${move.to}-${index}`}><span className="move-index">{index + 1}</span><strong>{move.from} <span>to</span> {move.to}</strong><span className={`move-side ${move.color === 'w' ? 'is-white' : 'is-black'}`}>{move.color === 'w' ? 'White' : 'Black'}</span></div>)}</div>
  </div></aside>;
}
