import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import GlassPanel from './components/GlassPanel';
import ChessBoard3D from './components/ChessBoard3D';
import SettingsDrawer from './components/SettingsDrawer';
import { getBestMove, getLegalMoves, PALETTE_MAP } from './lib/chessEngine';

const defaultSettings = {
  mode: 'ai',
  aiDifficulty: 'easy',
  showHints: true,
  showPossibleMoves: true,
  showGridNumbers: true,
  enableUndo: true,
  palette: 'classic',
};

function TopBar({ onReset, onUndo, onOpenSettings, undoCount }) {
  return (
    <header className="topbar glass-panel">
      <div>
        <p className="eyebrow">Quantum Board</p>
        <h1>Chess Arena</h1>
      </div>

      <div className="topbar-actions">
        <button className="ghost-button" onClick={onReset}>Reset</button>
        <button className="ghost-button" onClick={onUndo} disabled={undoCount === 0}>
          Undo ({undoCount})
        </button>
        <button className="icon-button" aria-label="Open settings" onClick={onOpenSettings}>⚙</button>
      </div>
    </header>
  );
}

function MatchPanel({ status, mode, hintsOn, historyLength, paletteName, aiDifficulty }) {
  return (
    <GlassPanel title="Match Panel" className="panel-left">
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

      <div className="piece-library">
        {['♔', '♕', '♖', '♗', '♘', '♙'].map((glyph) => (
          <span key={glyph} className="piece-badge">{glyph}</span>
        ))}
      </div>
    </GlassPanel>
  );
}

function GameControls({ onOpenSettings, onNewMatch, onUndo, undoCount, canUndo }) {
  return (
    <GlassPanel title="Controls" className="panel-right">
      <div className="control-stack">
        <button className="primary-button" onClick={onOpenSettings}>Open settings</button>
        <button className="secondary-button" onClick={onNewMatch}>New match</button>
        <button className="secondary-button" onClick={onUndo} disabled={!canUndo || undoCount === 0}>Undo last move</button>
      </div>

      <div className="legend">
        <h4>Shortcut Legend</h4>
        <ul>
          <li>💡 Hint mode</li>
          <li>⚡ Highlight moves</li>
          <li>🎯 File/rank labels</li>
        </ul>
      </div>
    </GlassPanel>
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

  const board = useMemo(() => game.board(), [game]);
  const palette = PALETTE_MAP[settings.palette] || PALETTE_MAP.classic;

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
  };

  const applyMove = ({ from, to }) => {
    const nextGame = new Chess(game.fen());
    const move = nextGame.move({ from, to, promotion: 'q' });
    if (!move) return false;

    setGame(nextGame);
    setMoveHistory((prev) => [...prev, { from, to }]);
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
      rebuilt.move({ from: move.from, to: move.to, promotion: 'q' });
    }

    setGame(rebuilt);
    setMoveHistory(trimmedHistory);
    setSelectedSquare(null);
    setLegalMoves([]);
    setUndoRemaining((prev) => prev - 1);
    updateStatus(rebuilt);
  };

  useEffect(() => {
    setGameMode(settings.mode);
  }, [settings.mode]);

  useEffect(() => {
    if (gameMode === 'ai' && game.turn() === 'b' && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const difficulty = settings.aiDifficulty || 'easy';
        const depth = difficulty === 'hard' ? 3 : 1;
        const nextMove = getBestMove(game, depth, difficulty);
        if (!nextMove) return;

        const nextGame = new Chess(game.fen());
        nextGame.move({ from: nextMove.from, to: nextMove.to, promotion: 'q' });
        setGame(nextGame);
        setMoveHistory((prev) => [...prev, { from: nextMove.from, to: nextMove.to }]);
        setSelectedSquare(null);
        setLegalMoves([]);
        updateStatus(nextGame);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [game, gameMode, settings.aiDifficulty]);

  const handleSquareClick = (square) => {
    const piece = game.get(square);

    if (gameMode === 'ai' && game.turn() !== 'w') return;

    if (selectedSquare && legalMoves.some((move) => move.to === square)) {
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
          undoCount={undoRemaining}
        />

        <main className="game-layout">
          <MatchPanel
            status={status}
            mode={gameMode}
            hintsOn={settings.showHints}
            historyLength={moveHistory.length}
            paletteName={settings.palette}
            aiDifficulty={settings.aiDifficulty || 'easy'}
          />

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
              />
              {settings.showHints && selectedSquare && hintSquare && (
                <div className="hint-badge">💡 Hint: {hintSquare}</div>
              )}
            </div>
          </section>

          <GameControls
            onOpenSettings={() => setSettingsOpen(true)}
            onNewMatch={resetBoard}
            onUndo={handleUndo}
            undoCount={undoRemaining}
            canUndo={settings.enableUndo}
          />
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
            setSettings((prev) => ({ ...prev, [key]: value }));
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}

export default App;
