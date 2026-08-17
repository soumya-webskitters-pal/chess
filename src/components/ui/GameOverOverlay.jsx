const confettiPieces = Array.from({ length: 42 }, (_, index) => ({
  id: index, left: (index * 37 + 9) % 100, delay: ((index * 13) % 18) / 10,
  duration: 2.4 + ((index * 7) % 14) / 10, rotation: (index * 47) % 360,
}));

export default function GameOverOverlay({ result, onNewMatch }) {
  return (
    <div className="game-over-layer" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      {result.type === 'win' && <div className="confetti-field" aria-hidden="true">
        {confettiPieces.map((piece) => <i key={piece.id} style={{ '--confetti-left': `${piece.left}%`, '--confetti-delay': `${piece.delay}s`, '--confetti-duration': `${piece.duration}s`, '--confetti-rotation': `${piece.rotation}deg`, '--confetti-color': `hsl(${(piece.id * 53) % 360} 88% 65%)` }} />)}
      </div>}
      <div className="game-over-card">
        <span className="game-over-kicker">{result.type === 'win' ? 'Checkmate' : 'Game drawn'}</span>
        <div className="game-over-emblem" aria-hidden="true">{result.type === 'win' ? '♛' : '½'}</div>
        <h2 id="game-over-title">{result.title}</h2><p>{result.detail}</p>
        <button className="primary-button game-over-action" onClick={onNewMatch}>Play again</button>
      </div>
    </div>
  );
}
