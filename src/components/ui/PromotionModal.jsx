import { PIECE_GLYPHS } from '../../lib/chessEngine';

const options = [{ type: 'q', label: 'Queen' }, { type: 'r', label: 'Rook' }, { type: 'b', label: 'Bishop' }, { type: 'n', label: 'Knight' }];

export default function PromotionModal({ color, selected, onSelect, onConfirm, onCancel }) {
  return <div className="promotion-overlay" onClick={onCancel}><section className="promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-title" onClick={(event) => event.stopPropagation()}>
    <p className="drawer-eyebrow">Pawn promotion</p><h2 id="promotion-title">Choose a piece</h2><p className="promotion-help">Your pawn reached the final rank. Queen is selected by default.</p>
    <div className="promotion-options">{options.map((option) => <button type="button" className={`promotion-option${selected === option.type ? ' is-selected' : ''}`} key={option.type} onClick={() => onSelect(option.type)} aria-pressed={selected === option.type}><span>{PIECE_GLYPHS[color][option.type]}</span><strong>{option.label}</strong>{selected === option.type && <small>Selected</small>}</button>)}</div>
    <div className="promotion-actions"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" onClick={onConfirm}>Promote</button></div>
  </section></div>;
}
