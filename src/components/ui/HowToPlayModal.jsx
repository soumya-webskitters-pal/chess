import { Fragment, useEffect, useState } from 'react';
import { PIECE_GLYPHS } from '../../lib/chessEngine';
import { PieceMoveDemo3D, RuleMoveDemo3D } from '../ChessBoard3D';

const pieces = [
  { type: 'k', icon: '♔', name: 'King', detail: 'Moves one square in any direction. The king cannot move into check. Protect it at all times.' },
  { type: 'q', icon: '♕', name: 'Queen', detail: 'Moves any number of squares horizontally, vertically, or diagonally. It cannot jump over pieces.' },
  { type: 'r', icon: '♖', name: 'Rook', detail: 'Moves any number of squares horizontally or vertically. It also participates in castling.' },
  { type: 'b', icon: '♗', name: 'Bishop', detail: 'Moves any number of squares diagonally. Each bishop stays on its starting square color.' },
  { type: 'n', icon: '♘', name: 'Knight', detail: 'Moves in an L shape: two squares in one direction and one sideways. It can jump over pieces.' },
  { type: 'p', icon: '♙', name: 'Pawn', detail: 'Moves forward one square, or two from its starting position. It captures one square diagonally forward.' },
];

const rules = [
  { type: 'checkmate', name: 'Check and checkmate', detail: 'When your king is attacked, you must move it, block the attack, or capture the attacker. If none is possible, it is checkmate.' },
  { type: 'castling', name: 'Castling', detail: 'Move the king two squares toward a rook; the rook crosses to the other side. Neither piece may have moved, and the king cannot castle through check.' },
  { type: 'promotion', name: 'Pawn promotion', detail: 'A pawn reaching the opposite end becomes a selected queen, rook, bishop, or knight.' },
  { type: 'enpassant', name: 'En passant', detail: 'A pawn may capture an adjacent pawn that just advanced two squares, as though it had moved only one. This is available immediately only.' },
  { type: 'draws', name: 'Draws', detail: 'A game can draw by stalemate, insufficient material, threefold repetition, or the fifty-move rule.' },
  { type: 'controls', name: 'Using this board', detail: 'Select one of your pieces to see legal destinations, then select a highlighted square. Use Undo when enabled, or switch between 3D and 2D views.' },
];

const promotionOptions = [{ type: 'q', label: 'Queen' }, { type: 'r', label: 'Rook' }, { type: 'b', label: 'Bishop' }, { type: 'n', label: 'Knight' }];

export default function HowToPlayModal({ onClose, palette }) {
  const [selectedPiece, setSelectedPiece] = useState(pieces[0]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [promotion, setPromotion] = useState('q');

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="how-to-overlay" onClick={onClose}><section className="how-to-modal" role="dialog" aria-modal="true" aria-labelledby="how-to-title" onClick={(event) => event.stopPropagation()}>
    <header className="how-to-header"><div><p className="drawer-eyebrow">Chess guide</p><h2 id="how-to-title">How to play</h2></div><button className="modal-close" onClick={onClose} aria-label="Close how to play">✕</button></header>
    <div className="how-to-content">
      <section className="guide-section"><h3>Objective and turns</h3><p>White moves first, then players alternate turns. Move one piece per turn. Capture an opponent’s piece by moving onto its square. Win by checkmating the enemy king: attack it so there is no legal escape.</p></section>
      <section className="guide-section"><h3>How each piece moves</h3><div className="piece-guide-grid">
        {pieces.map((piece) => <Fragment key={piece.name}><article className={`piece-guide-card${selectedPiece.type === piece.type ? ' is-active' : ''}`}>
          <button type="button" className="piece-guide-trigger" onClick={() => setSelectedPiece(piece)}><span className="guide-piece-icon" aria-hidden="true">{piece.icon}</span><div><h4>{piece.name}</h4><p>{piece.detail}</p></div></button>
          {selectedPiece.type === piece.type && <div className="piece-move-demo"><div className="piece-demo-heading"><div><span>3D movement guide</span><h4>{selectedPiece.name}</h4></div><p>Green squares show the movement pattern. Drag to rotate and scroll to zoom.</p></div><PieceMoveDemo3D type={selectedPiece.type} palette={palette} /></div>}
        </article></Fragment>)}
      </div></section>
      <section className="guide-section rule-grid">{rules.map((rule) => <article className={`rule-guide-card${selectedRule === rule.type ? ' is-active' : ''}`} key={rule.type}>
        <button type="button" className="rule-guide-trigger" onClick={() => setSelectedRule(rule.type)}><h4>{rule.name}</h4><p>{rule.detail}</p></button>
        {selectedRule === rule.type && <div className="piece-move-demo rule-move-demo"><div className="piece-demo-heading"><div><span>3D rule simulation</span><h4>{rule.name}</h4></div></div>
          {rule.type === 'promotion' && <div className="guide-promotion-picker"><span>Choose promotion</span><div>{promotionOptions.map((option) => <button type="button" className={promotion === option.type ? 'is-selected' : ''} key={option.type} onClick={() => setPromotion(option.type)}><b>{PIECE_GLYPHS.w[option.type]}</b><small>{option.label}</small></button>)}</div></div>}
          <RuleMoveDemo3D rule={rule.type} palette={palette} promotionType={promotion} />
        </div>}
      </article>)}</section>
    </div>
  </section></div>;
}
