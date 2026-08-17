import { Fragment, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard3D, { PieceMoveDemo3D, RuleMoveDemo3D } from './components/ChessBoard3D';
import SettingsDrawer from './components/SettingsDrawer';
import { getBestMove, getLegalMoves, PALETTE_MAP, PIECE_GLYPHS } from './lib/chessEngine';

const defaultSettings = {
  mode: 'ai',
  playerColor: 'w',
  aiDifficulty: 'easy',
  showHints: true,
  showPossibleMoves: true,
  showGridNumbers: true,
  enableUndo: true,
  palette: 'classic',
};

function TopBar({ onReset, onUndo, onOpenSettings, onOpenHowToPlay, undoCount, children }) {
  return (
    <header className="topbar glass-panel">
      <div className="topbar-brand">
        <p className="eyebrow">Quantum Board</p>
        <div className="title-row">
          <h1>Chess Arena</h1>
          <button className="title-new-match" onClick={onReset}>New match</button>
          <button className="how-to-button" onClick={onOpenHowToPlay}>How to play</button>
        </div>
      </div>

      <div className="topbar-match">{children}</div>

      <div className="topbar-actions">
        <button className="ghost-button undo-button" onClick={onUndo} disabled={undoCount === 0}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 7 4 12l5 5M4 12h9a7 7 0 0 1 7 7" />
          </svg>
          <span>Undo ({undoCount})</span>
        </button>
        <button className="icon-button" aria-label="Open settings" onClick={onOpenSettings}>⚙</button>
      </div>
    </header>
  );
}

const pieceGuides = [
  { type: 'k', icon: '♔', name: 'King', detail: 'Moves one square in any direction. The king cannot move into check. Protect it at all times.' },
  { type: 'q', icon: '♕', name: 'Queen', detail: 'Moves any number of squares horizontally, vertically, or diagonally. It cannot jump over pieces.' },
  { type: 'r', icon: '♖', name: 'Rook', detail: 'Moves any number of squares horizontally or vertically. It also participates in castling.' },
  { type: 'b', icon: '♗', name: 'Bishop', detail: 'Moves any number of squares diagonally. Each bishop stays on its starting square color.' },
  { type: 'n', icon: '♘', name: 'Knight', detail: 'Moves in an L shape: two squares in one direction and one sideways. It can jump over pieces.' },
  { type: 'p', icon: '♙', name: 'Pawn', detail: 'Moves forward one square, or two from its starting position. It captures one square diagonally forward.' },
];

const ruleGuides = [
  { type: 'checkmate', name: 'Check and checkmate', detail: 'When your king is attacked, you must move it, block the attack, or capture the attacker. If none is possible, it is checkmate.' },
  { type: 'castling', name: 'Castling', detail: 'Move the king two squares toward a rook; the rook crosses to the other side. Neither piece may have moved, and the king cannot castle through check.' },
  { type: 'promotion', name: 'Pawn promotion', detail: 'A pawn reaching the opposite end becomes a queen in this game.' },
  { type: 'enpassant', name: 'En passant', detail: 'A pawn may capture an adjacent pawn that just advanced two squares, as though it had moved only one. This is available immediately only.' },
  { type: 'draws', name: 'Draws', detail: 'A game can draw by stalemate, insufficient material, threefold repetition, or the fifty-move rule.' },
  { type: 'controls', name: 'Using this board', detail: 'Select one of your pieces to see legal destinations, then select a highlighted square. Use Undo when enabled, or switch between 3D and 2D views.' },
];

function HowToPlayModal({ onClose, palette }) {
  const [selectedPiece, setSelectedPiece] = useState(pieceGuides[0]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [guidePromotion, setGuidePromotion] = useState('q');
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="how-to-overlay" onClick={onClose}>
      <section className="how-to-modal" role="dialog" aria-modal="true" aria-labelledby="how-to-title" onClick={(event) => event.stopPropagation()}>
        <header className="how-to-header">
          <div>
            <p className="drawer-eyebrow">Chess guide</p>
            <h2 id="how-to-title">How to play</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close how to play">✕</button>
        </header>

        <div className="how-to-content">
          <section className="guide-section">
            <h3>Objective and turns</h3>
            <p>White moves first, then players alternate turns. Move one piece per turn. Capture an opponent’s piece by moving onto its square. Win by checkmating the enemy king: attack it so there is no legal escape.</p>
          </section>

          <section className="guide-section">
            <h3>How each piece moves</h3>
            <div className="piece-guide-grid">
              {pieceGuides.map((piece) => (
                <Fragment key={piece.name}>
                  <article
                    className={`piece-guide-card${selectedPiece.type === piece.type ? ' is-active' : ''}`}
                  >
                    <button
                      type="button"
                      className="piece-guide-trigger"
                      onClick={() => setSelectedPiece(piece)}
                    >
                      <span className="guide-piece-icon" aria-hidden="true">{piece.icon}</span>
                      <div><h4>{piece.name}</h4><p>{piece.detail}</p></div>
                    </button>
                    {selectedPiece.type === piece.type && (
                      <div className="piece-move-demo">
                        <div className="piece-demo-heading">
                          <div><span>3D movement guide</span><h4>{selectedPiece.name}</h4></div>
                          <p>Green squares show the movement pattern. Drag to rotate and scroll to zoom.</p>
                        </div>
                        <PieceMoveDemo3D type={selectedPiece.type} palette={palette} />
                      </div>
                    )}
                  </article>
                </Fragment>
              ))}
            </div>
          </section>

          <section className="guide-section rule-grid">
            {ruleGuides.map((rule) => (
              <article className={`rule-guide-card${selectedRule === rule.type ? ' is-active' : ''}`} key={rule.type}>
                <button type="button" className="rule-guide-trigger" onClick={() => setSelectedRule(rule.type)}>
                  <h4>{rule.name}</h4><p>{rule.detail}</p>
                </button>
                {selectedRule === rule.type && (
                  <div className="piece-move-demo rule-move-demo">
                    <div className="piece-demo-heading"><div><span>3D rule simulation</span><h4>{rule.name}</h4></div></div>
                    {rule.type === 'promotion' && (
                      <div className="guide-promotion-picker">
                        <span>Choose promotion</span>
                        <div>
                          {promotionOptions.map((option) => (
                            <button
                              type="button"
                              className={guidePromotion === option.type ? 'is-selected' : ''}
                              key={option.type}
                              onClick={() => setGuidePromotion(option.type)}
                            >
                              <b>{PIECE_GLYPHS.w[option.type]}</b>
                              <small>{option.label}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <RuleMoveDemo3D rule={rule.type} palette={palette} promotionType={guidePromotion} />
                  </div>
                )}
              </article>
            ))}
          </section>
        </div>
      </section>
    </div>
  );
}

const promotionOptions = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

function PromotionModal({ color, selected, onSelect, onConfirm, onCancel }) {
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <section className="promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-title" onClick={(event) => event.stopPropagation()}>
        <p className="drawer-eyebrow">Pawn promotion</p>
        <h2 id="promotion-title">Choose a piece</h2>
        <p className="promotion-help">Your pawn reached the final rank. Queen is selected by default.</p>
        <div className="promotion-options">
          {promotionOptions.map((option) => (
            <button
              type="button"
              className={`promotion-option${selected === option.type ? ' is-selected' : ''}`}
              key={option.type}
              onClick={() => onSelect(option.type)}
              aria-pressed={selected === option.type}
            >
              <span>{PIECE_GLYPHS[color][option.type]}</span>
              <strong>{option.label}</strong>
              {selected === option.type && <small>Selected</small>}
            </button>
          ))}
        </div>
        <div className="promotion-actions">
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" onClick={onConfirm}>Promote</button>
        </div>
      </section>
    </div>
  );
}

function MatchPanel({ status, mode, playerColor, hintsOn, historyLength, paletteName, aiDifficulty }) {
  return (
    <section className="match-panel-top">
      <div className="status-row">
        <span className="status-label">State</span>
        <strong>{status}</strong>
      </div>

      <div className="meta-grid">
        <div>
          <span>Mode</span>
          <strong>{mode === 'ai' ? 'AI' : 'Local'}</strong>
        </div>
        <div>
          <span>AI</span>
          <strong>{mode === 'ai' ? aiDifficulty : 'N/A'}</strong>
        </div>
        <div>
          <span>Your side</span>
          <strong>{mode === 'ai' ? (playerColor === 'w' ? 'White' : 'Black') : 'Both'}</strong>
        </div>
        <div>
          <span>Hints</span>
          <strong>{hintsOn ? 'On' : 'Off'}</strong>
        </div>
        <div>
          <span>Moves</span>
          <strong>{historyLength}</strong>
        </div>
        <div>
          <span>Colors</span>
          <strong>{paletteName}</strong>
        </div>
      </div>

    </section>
  );
}

function MoveHistoryPanel({ moveHistory }) {
  return (
    <aside className="move-history-panel glass-panel">
      <div className="move-log">
        <div className="move-log-header">
          <h4>Move History</h4>
          <span>{moveHistory.length}</span>
        </div>
        <div className="move-log-list">
          {moveHistory.length === 0 ? (
            <p className="move-log-empty">No moves yet</p>
          ) : moveHistory.map((move, index) => (
            <div className="move-log-item" key={`${move.from}-${move.to}-${index}`}>
              <span className="move-index">{index + 1}</span>
              <strong>{move.from} <span>to</span> {move.to}</strong>
              <span className={`move-side ${move.color === 'w' ? 'is-white' : 'is-black'}`}>
                {move.color === 'w' ? 'White' : 'Black'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function App() {
  const [game, setGame] = useState(() => new Chess());
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [gameMode, setGameMode] = useState(defaultSettings.mode);
  const [status, setStatus] = useState('White to move');
  const [undoRemaining, setUndoRemaining] = useState(3);
  const [topView, setTopView] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [promotionChoice, setPromotionChoice] = useState('q');
  const [hintVisible, setHintVisible] = useState(false);

  const board = useMemo(() => game.board(), [game]);
  const palette = PALETTE_MAP[settings.palette] || PALETTE_MAP.classic;
  const checkedKingSquare = useMemo(() => {
    if (!game.isCheck()) return null;
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        const piece = board[row][col];
        if (piece?.type === 'k' && piece.color === game.turn()) {
          return `${String.fromCharCode(97 + col)}${8 - row}`;
        }
      }
    }
    return null;
  }, [board, game]);
  const capturedPieces = useMemo(() => moveHistory
    .filter((move) => move.captured)
    .map((move) => ({ type: move.captured, color: move.capturedColor })), [moveHistory]);

  const updateStatus = (nextGame) => {
    if (nextGame.isCheckmate()) {
      setStatus(nextGame.turn() === 'w' ? 'Checkmate! Black wins' : 'Checkmate! White wins');
      return;
    }
    if (nextGame.isDraw()) {
      setStatus('Draw game');
      return;
    }
    setStatus(`${nextGame.turn() === 'w' ? 'White' : 'Black'} to move`);
  };

  const resetBoard = () => {
    const freshGame = new Chess();
    setGame(freshGame);
    setMoveHistory([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setUndoRemaining(3);
    setStatus('White to move');
    setPendingPromotion(null);
    setPromotionChoice('q');
    setHintVisible(false);
  };

  const applyMove = ({ from, to, promotion = 'q' }) => {
    const nextGame = new Chess(game.fen());
    const move = nextGame.move({ from, to, promotion });
    if (!move) return false;

    setGame(nextGame);
    setMoveHistory((prev) => [...prev, {
      from,
      to,
      captured: move.captured || null,
      capturedColor: move.captured ? (move.color === 'w' ? 'b' : 'w') : null,
      color: move.color,
      promotion: move.promotion || null,
    }]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setUndoRemaining(3);
    updateStatus(nextGame);
    return true;
  };

  const handleUndo = () => {
    if (!settings.enableUndo || moveHistory.length === 0 || undoRemaining <= 0) return;

    const trimmedHistory = moveHistory.slice(0, -1);
    const rebuilt = new Chess();
    for (const move of trimmedHistory) {
      rebuilt.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
    }

    setGame(rebuilt);
    setMoveHistory(trimmedHistory);
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setUndoRemaining((prev) => prev - 1);
    updateStatus(rebuilt);
  };

  useEffect(() => {
    setGameMode(settings.mode);
  }, [settings.mode]);

  useEffect(() => {
    if (gameMode === 'ai' && game.turn() !== settings.playerColor && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const difficulty = settings.aiDifficulty || 'easy';
        const depth = difficulty === 'hard' ? 3 : 1;
        const nextMove = getBestMove(game, depth, difficulty);
        if (!nextMove) return;

        const nextGame = new Chess(game.fen());
        const move = nextGame.move({ from: nextMove.from, to: nextMove.to, promotion: 'q' });
        setGame(nextGame);
        setMoveHistory((prev) => [...prev, {
          from: nextMove.from,
          to: nextMove.to,
          captured: move.captured || null,
          capturedColor: move.captured ? (move.color === 'w' ? 'b' : 'w') : null,
          color: move.color,
        }]);
        setSelectedSquare(null);
        setLegalMoves([]);
        updateStatus(nextGame);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [game, gameMode, settings.aiDifficulty, settings.playerColor]);

  const handleSquareClick = (square) => {
    const piece = game.get(square);

    if (gameMode === 'ai' && game.turn() !== settings.playerColor) return;

    if (selectedSquare && legalMoves.some((move) => move.to === square)) {
      const selectedPiece = game.get(selectedSquare);
      const promotionRank = selectedPiece?.color === 'w' ? '8' : '1';
      if (selectedPiece?.type === 'p' && square.endsWith(promotionRank)) {
        setPromotionChoice('q');
        setPendingPromotion({ from: selectedSquare, to: square, color: selectedPiece.color });
        return;
      }
      applyMove({ from: selectedSquare, to: square });
      return;
    }

    if (!piece || piece.color !== game.turn()) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const validMoves = getLegalMoves(game, square);
    setSelectedSquare(square);
    setLegalMoves(validMoves);
  };

  const selectedMoves = selectedSquare ? legalMoves.map((move) => move.to) : [];
  const hintSquare = selectedSquare && selectedMoves.length ? selectedMoves[0] : null;

  return (
    <>
      <div className="app-shell">
        <div className="nebula nebula-1" />
        <div className="nebula nebula-2" />

        <TopBar
          onReset={resetBoard}
          onUndo={handleUndo}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          undoCount={undoRemaining}
        >
          <MatchPanel
            status={status}
            mode={gameMode}
            playerColor={settings.playerColor}
            hintsOn={settings.showHints}
            historyLength={moveHistory.length}
            paletteName={{ classic: 'Classic', gold: 'Golden', neon: 'Neon' }[settings.palette]}
            aiDifficulty={settings.aiDifficulty || 'easy'}
          />
        </TopBar>

        <main className="game-layout">
          <div className="game-sidebar">
            <MoveHistoryPanel moveHistory={moveHistory} />
          </div>
          <section className="board-panel glass-panel">
            <div className="board-frame">
              <ChessBoard3D
                board={board}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                onSquareClick={handleSquareClick}
                palette={palette}
                showGrid={settings.showGridNumbers}
                showPossibleMoves={settings.showPossibleMoves}
                playerColor={settings.playerColor}
                capturedPieces={capturedPieces}
                topView={topView}
                checkedKingSquare={checkedKingSquare}
              />
              <button
                className="view-toggle-button"
                onClick={() => setTopView((current) => !current)}
                aria-pressed={topView}
              >
                {topView ? '3D View' : '2D View'}
              </button>
              {settings.showHints && (
                <>
                  <button
                    className={`hint-bulb-button${hintVisible ? ' is-active' : ''}`}
                    onClick={() => setHintVisible((visible) => !visible)}
                    aria-label={hintVisible ? 'Hide hint' : 'Show hint'}
                    aria-pressed={hintVisible}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 18h6M10 22h4M8.4 14.6A6 6 0 1 1 15.6 14.6C14.6 15.3 14 16.2 14 17h-4c0-.8-.6-1.7-1.6-2.4Z" />
                    </svg>
                  </button>
                  {hintVisible && (
                    <div className="hint-badge">
                      {selectedSquare && hintSquare
                        ? `Hint: ${selectedSquare} to ${hintSquare}`
                        : 'Select a piece to see a hint'}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

        </main>
      </div>

      {settingsOpen && (
        <SettingsDrawer
          settings={{ ...settings, mode: gameMode }}
          onChange={(key, value) => {
            if (key === 'mode') {
              setGameMode(value);
              setSettings((prev) => ({ ...prev, mode: value }));
              return;
            }
            if (key === 'playerColor') {
              setSettings((prev) => ({ ...prev, playerColor: value }));
              resetBoard();
              return;
            }
            setSettings((prev) => ({ ...prev, [key]: value }));
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} palette={palette} />}

      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          selected={promotionChoice}
          onSelect={setPromotionChoice}
          onCancel={() => setPendingPromotion(null)}
          onConfirm={() => {
            applyMove({ ...pendingPromotion, promotion: promotionChoice });
            setPendingPromotion(null);
          }}
        />
      )}
    </>
  );
}

export default App;
