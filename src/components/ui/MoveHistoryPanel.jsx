import { useState } from 'react';

export default function MoveHistoryPanel({ moveHistory, matchHistory, onClose }) {
  const [tab, setTab] = useState('moves');
  return <aside className="move-history-panel glass-panel"><div className="move-log">
    <div className="move-log-header"><h4>Game History</h4><div className="move-history-header-actions"><button className="move-history-close" onClick={onClose} aria-label="Close history">✕</button></div></div>
    <div className="history-tabs"><button className={tab === 'moves' ? 'active' : ''} onClick={() => setTab('moves')}>Moves <span>{moveHistory.length}</span></button><button className={tab === 'games' ? 'active' : ''} onClick={() => setTab('games')}>Games <span>{matchHistory.length}</span></button></div>
    {tab === 'moves' ? <div className="move-log-list">{moveHistory.length === 0 ? <p className="move-log-empty">No moves yet</p> : moveHistory.map((move, index) => <div className="move-log-item" key={`${move.from}-${move.to}-${index}`}><span className="move-index">{index + 1}</span><strong>{move.from} <span>to</span> {move.to}</strong><span className={`move-side ${move.color === 'w' ? 'is-white' : 'is-black'}`}>{move.color === 'w' ? 'White' : 'Black'}</span></div>)}</div> : <div className="match-history-list">{matchHistory.length === 0 ? <p className="move-log-empty">Completed games appear here</p> : matchHistory.map((item) => <article key={item.id}><div><strong>{item.winner === 'Draw' ? 'Draw' : `${item.winner} won`}</strong><span>{item.mode === 'online' ? 'Online' : item.mode === 'ai' ? 'Vs AI' : 'Local'}</span></div><small>{item.moves} moves · {item.playedAt}</small></article>)}</div>}
  </div></aside>;
}
