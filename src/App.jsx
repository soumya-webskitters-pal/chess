import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard3D, { loadPieceAssets } from './components/ChessBoard3D';
import SettingsDrawer from './components/SettingsDrawer';
import AssetLoadingScreen from './components/ui/AssetLoadingScreen';
import GameOverOverlay from './components/ui/GameOverOverlay';
import HowToPlayModal from './components/ui/HowToPlayModal';
import MatchPanel from './components/ui/MatchPanel';
import MoveHistoryPanel from './components/ui/MoveHistoryPanel';
import PromotionModal from './components/ui/PromotionModal';
import TopBar from './components/ui/TopBar';
import OnlineLobby from './components/ui/OnlineLobby';
import OnlineSocial from './components/ui/OnlineSocial';
import AppFooter from './components/ui/AppFooter';
import LegalModal from './components/ui/LegalModal';
import { getBestMove, getLegalMoves, learnPlayerStyle, PALETTE_MAP } from './lib/chessEngine';
import useOnlineChess from './hooks/useOnlineChess';

const defaultSettings = {
  mode: 'ai',
  playerColor: 'w',
  aiDifficulty: 'easy',
  showHints: true,
  showPossibleMoves: true,
  showGridNumbers: true,
  enableUndo: true,
  highGraphics: false,
  palette: 'classic',
};

function App() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [loaderStartedAt] = useState(() => Date.now());
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelsReady, setModelsReady] = useState(false);
  const [game, setGame] = useState(() => new Chess());
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [gameMode, setGameMode] = useState(defaultSettings.mode);
  const [status, setStatus] = useState('White to move');
  const [gameTime, setGameTime] = useState(0);
  const [undoRemaining, setUndoRemaining] = useState(3);
  const [topView, setTopView] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [promotionChoice, setPromotionChoice] = useState('q');
  const [hintVisible, setHintVisible] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [matchInfoExpanded, setMatchInfoExpanded] = useState(false);
  const [onlineLobbyOpen, setOnlineLobbyOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [reaction, setReaction] = useState(null);
  const [legalOpen, setLegalOpen] = useState(null);
  const [matchHistory, setMatchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quantum-chess-history')) || []; } catch { return []; }
  });
  const recordedResultRef = useRef(false);
  const appShellRef = useRef(null);
  const online = useOnlineChess();

  useEffect(() => { localStorage.setItem('quantum-chess-history', JSON.stringify(matchHistory)); }, [matchHistory]);

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get('room');
    if (!room) return;
    setGameMode('online');
    setSettings((prev) => ({ ...prev, mode: 'online' }));
    setOnlineLobbyOpen(true);
    online.join(room);
  }, [online.join]);

  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(document.fullscreenElement === appShellRef.current);
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  useEffect(() => {
    let animationFrame;
    const updateLoaderProgress = () => {
      const elapsed = Date.now() - loaderStartedAt;
      setLoaderProgress(Math.min(100, (elapsed / 4000) * 100));
      if (elapsed < 4000) animationFrame = window.requestAnimationFrame(updateLoaderProgress);
    };
    animationFrame = window.requestAnimationFrame(updateLoaderProgress);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [loaderStartedAt]);

  useEffect(() => {
    let active = true;
    loadPieceAssets((progress) => {
      if (active) setModelProgress(progress);
    }).then(() => {
      if (active) {
        setModelProgress(100);
        setModelsReady(true);
      }
    }).catch((error) => {
      console.error('Unable to load chess piece models', error);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!modelsReady || loaderProgress < 100) return undefined;
    const revealTimer = window.setTimeout(() => setAssetsReady(true), 120);
    return () => window.clearTimeout(revealTimer);
  }, [loaderProgress, modelsReady]);

  useEffect(() => {
    if (!assetsReady || game.isGameOver()) return undefined;
    const timer = window.setInterval(() => setGameTime((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [assetsReady, game]);

  const board = useMemo(() => game.board(), [game]);
  const palette = PALETTE_MAP[settings.palette] || PALETTE_MAP.classic;
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', palette.accent);
    document.documentElement.style.setProperty('--theme-light', palette.white);
    document.documentElement.style.setProperty('--theme-dark', palette.darkTile);
  }, [palette]);
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
  const gameResult = useMemo(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      return { type: 'win', title: `${winner} wins!`, detail: 'The king has been checkmated.' };
    }
    if (game.isStalemate()) {
      return { type: 'draw', title: 'Stalemate', detail: 'The player to move has no legal move and is not in check.' };
    }
    if (game.isInsufficientMaterial()) {
      return { type: 'draw', title: 'Draw', detail: 'There is insufficient material to deliver checkmate.' };
    }
    if (game.isThreefoldRepetition()) {
      return { type: 'draw', title: 'Draw', detail: 'The same position occurred three times.' };
    }
    if (game.isDrawByFiftyMoves()) {
      return { type: 'draw', title: 'Draw', detail: 'Fifty moves passed without a pawn move or capture.' };
    }
    return null;
  }, [game]);

  const updateStatus = (nextGame) => {
    if (nextGame.isCheckmate()) {
      setStatus(nextGame.turn() === 'w' ? 'Checkmate! Black wins' : 'Checkmate! White wins');
      return;
    }
    if (nextGame.isStalemate()) {
      setStatus('Draw by stalemate');
      return;
    }
    if (nextGame.isInsufficientMaterial()) {
      setStatus('Draw by insufficient material');
      return;
    }
    if (nextGame.isThreefoldRepetition()) {
      setStatus('Draw by repetition');
      return;
    }
    if (nextGame.isDrawByFiftyMoves()) {
      setStatus('Draw by fifty-move rule');
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
    setGameTime(0);
    setPendingPromotion(null);
    setPromotionChoice('q');
    setHintVisible(false);
    recordedResultRef.current = false;
  };

  const resetCurrentGame = () => {
    resetBoard();
    if (gameMode === 'online' && online.status === 'playing') online.send({ type: 'reset' });
  };

  const applyMove = ({ from, to, promotion = 'q' }, broadcast = true) => {
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
      piece: move.piece,
      san: move.san,
      flags: move.flags,
      promotion: move.promotion || null,
    }]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setHintVisible(false);
    setUndoRemaining(3);
    updateStatus(nextGame);
    if (broadcast && gameMode === 'online') online.send({ type: 'move', from, to, promotion });
    return true;
  };

  useEffect(() => {
    const data = online.event;
    if (!data) return;
    if (data.type === 'connected') {
      setGameMode('online');
      setSettings((prev) => ({ ...prev, mode: 'online' }));
      resetBoard();
      setChatMessages([]);
      setOnlineLobbyOpen(false);
    } else if (data.type === 'move') {
      const remoteColor = online.playerColor === 'w' ? 'b' : 'w';
      if (game.get(data.from)?.color === remoteColor) applyMove({ from: data.from, to: data.to, promotion: data.promotion || 'q' }, false);
    } else if (data.type === 'chat' && typeof data.text === 'string') {
      const text = data.text.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 80);
      if (text) setChatMessages((items) => [...items, { id: data.eventId, text, mine: false }].slice(-60));
    } else if (data.type === 'reaction' && typeof data.emoji === 'string') {
      setReaction({ emoji: data.emoji.slice(0, 4), id: data.eventId });
    } else if (data.type === 'reset') {
      resetBoard();
      setStatus('White to move · new online game');
    } else if (data.type === 'leave' || data.type === 'disconnected') {
      setStatus('Friend disconnected');
    }
  // online.event uniquely identifies incoming messages; game is intentionally read from this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online.event]);

  useEffect(() => {
    if (!reaction) return undefined;
    const timer = window.setTimeout(() => setReaction(null), 2400);
    return () => window.clearTimeout(timer);
  }, [reaction]);

  const handleUndo = () => {
    if (gameMode === 'online' || !settings.enableUndo || moveHistory.length === 0 || undoRemaining <= 0) return;

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

  const learnedPlayerStyle = useMemo(
    () => learnPlayerStyle(moveHistory, settings.playerColor),
    [moveHistory, settings.playerColor],
  );

  useEffect(() => {
    if (gameMode === 'ai' && game.turn() !== settings.playerColor && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const difficulty = settings.aiDifficulty || 'easy';
        const depth = difficulty === 'hard' ? 3 : 1;
        const nextMove = getBestMove(game, depth, difficulty, learnedPlayerStyle);
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
          piece: move.piece,
          san: move.san,
          flags: move.flags,
        }]);
        setSelectedSquare(null);
        setLegalMoves([]);
        updateStatus(nextGame);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [game, gameMode, learnedPlayerStyle, settings.aiDifficulty, settings.playerColor]);

  const handleSquareClick = (square) => {
    if (game.isGameOver()) return;
    const piece = game.get(square);

    if (gameMode === 'ai' && game.turn() !== settings.playerColor) return;
    if (gameMode === 'online' && (online.status !== 'playing' || game.turn() !== online.playerColor)) return;

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
  const suggestedMove = useMemo(() => {
    if (!settings.showHints || game.isGameOver()) return null;
    if (gameMode === 'ai' && game.turn() !== settings.playerColor) return null;
    return getBestMove(game, 2, 'hard');
  }, [game, gameMode, settings.playerColor, settings.showHints]);
  const hintedFrom = !selectedSquare && hintVisible ? suggestedMove?.from : null;
  const boardSelectedSquare = selectedSquare || hintedFrom;
  const boardLegalMoves = selectedSquare
    ? legalMoves
    : (hintVisible && suggestedMove ? [{ to: suggestedMove.to }] : []);
  const isMyTurn = !game.isGameOver() && (
    (gameMode === 'ai' && game.turn() === settings.playerColor)
    || (gameMode === 'online' && online.status === 'playing' && game.turn() === online.playerColor)
  );

  useEffect(() => {
    if (!gameResult || recordedResultRef.current) return;
    recordedResultRef.current = true;
    const winner = game.isCheckmate() ? (game.turn() === 'w' ? 'Black' : 'White') : 'Draw';
    setMatchHistory((items) => [{ id: Date.now(), winner, mode: gameMode, moves: moveHistory.length, playedAt: new Date().toLocaleString() }, ...items].slice(0, 30));
  }, [game, gameMode, gameResult, moveHistory.length]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await appShellRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen mode is unavailable', error);
    }
  };

  if (!assetsReady) {
    return <AssetLoadingScreen progress={Math.min(loaderProgress, modelProgress)} />;
  }

  return (
    <>
      <div className="app-shell" ref={appShellRef}>
        <div className="nebula nebula-1" />
        <div className="nebula nebula-2" />

        <TopBar
          onReset={resetCurrentGame}
          onUndo={handleUndo}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          undoCount={undoRemaining}
          undoDisabled={gameMode === 'online' || !settings.enableUndo || moveHistory.length === 0}
          showUndo={gameMode !== 'online'}
          infoExpanded={matchInfoExpanded}
          onToggleInfo={() => setMatchInfoExpanded((expanded) => !expanded)}
          showSettings={gameMode !== 'online'}
          showNewMatch={gameMode !== 'online'}
        >
          <MatchPanel
            status={status}
            mode={gameMode}
            playerColor={settings.playerColor}
            hintsOn={settings.showHints}
            historyLength={moveHistory.length}
            paletteName={{ classic: 'Classic', gold: 'Golden', neon: 'Neon' }[settings.palette]}
            aiDifficulty={settings.aiDifficulty || 'easy'}
            gameTime={gameTime}
          />
        </TopBar>

        <main className="game-layout">
          <button
            className={`history-backdrop${historyOpen ? ' is-visible' : ''}`}
            onClick={() => setHistoryOpen(false)}
            aria-label="Close move history"
            tabIndex={historyOpen ? 0 : -1}
          />
          <div className={`game-sidebar${historyOpen ? ' is-open' : ''}`} aria-hidden={!historyOpen}>
            <MoveHistoryPanel moveHistory={moveHistory} matchHistory={matchHistory} onClose={() => setHistoryOpen(false)} />
          </div>
          <section className="board-panel glass-panel">
            <div className="board-frame">
              <ChessBoard3D
                board={board}
                selectedSquare={boardSelectedSquare}
                legalMoves={boardLegalMoves}
                onSquareClick={handleSquareClick}
                palette={palette}
                showGrid={settings.showGridNumbers}
                showPossibleMoves={settings.showPossibleMoves}
                playerColor={settings.playerColor}
                capturedPieces={capturedPieces}
                topView={topView}
                checkedKingSquare={checkedKingSquare}
                highGraphics={settings.highGraphics}
                graphicsTheme={settings.palette}
              />
              <button
                className="view-toggle-button"
                onClick={() => setTopView((current) => !current)}
                aria-pressed={topView}
              >
                {topView ? '3D View' : '2D View'}
              </button>
              <button className={`online-play-button${online.status === 'playing' ? ' is-live' : ''}`} onClick={() => { setGameMode('online'); setSettings((prev) => ({ ...prev, mode: 'online' })); setOnlineLobbyOpen(true); }}>
                <span className="live-dot" />{online.status === 'playing' ? 'Online' : 'Play online'}
              </button>
              <button
                className="fullscreen-toggle-button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                aria-pressed={isFullscreen}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {isFullscreen
                    ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                    : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
                </svg>
              </button>
              <button
                className="history-toggle-button"
                onClick={() => setHistoryOpen(true)}
                aria-label="Open move history"
                aria-expanded={historyOpen}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
                <span>Moves</span>
                <strong>{moveHistory.length}</strong>
              </button>
              {isMyTurn && <div className="your-turn-badge" role="status">Your turn</div>}
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
                        : suggestedMove
                          ? `Best move: ${suggestedMove.from} to ${suggestedMove.to}`
                          : 'No hint available'}
                    </div>
                  )}
                </>
              )}
              {gameResult && <GameOverOverlay result={gameResult} onNewMatch={resetCurrentGame} />}
              {reaction && <div key={reaction.id} className="chess-reaction-burst"><span>{reaction.emoji}</span><small>Friend reacted!</small></div>}
              {gameMode === 'online' && online.status === 'playing' && <OnlineSocial
                messages={chatMessages}
                onSendMessage={(text) => {
                  if (online.send({ type: 'chat', text })) setChatMessages((items) => [...items, { id: `${Date.now()}-mine`, text, mine: true }].slice(-60));
                }}
                onReaction={(emoji) => online.send({ type: 'reaction', emoji })}
                onLeave={() => { online.close(true); setGameMode('local'); setSettings((prev) => ({ ...prev, mode: 'local' })); }}
              />}
            </div>
          </section>

        </main>
        <AppFooter onOpenLegal={setLegalOpen} />
      </div>

      {settingsOpen && (
        <SettingsDrawer
          settings={{ ...settings, mode: gameMode }}
          topView={topView}
          isFullscreen={isFullscreen}
          onNewGame={() => {
            resetCurrentGame();
            setSettingsOpen(false);
          }}
          onToggleView={() => setTopView((current) => !current)}
          onToggleFullscreen={() => {
            setSettingsOpen(false);
            toggleFullscreen();
          }}
          onOpenHowToPlay={() => {
            setSettingsOpen(false);
            setHowToPlayOpen(true);
          }}
          onChange={(key, value) => {
            if (key === 'mode') {
              setGameMode(value);
              setSettings((prev) => ({ ...prev, mode: value }));
              if (value === 'online') setOnlineLobbyOpen(true);
              else if (online.status !== 'idle') online.close(true);
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

      {onlineLobbyOpen && <OnlineLobby online={online} onClose={() => setOnlineLobbyOpen(false)} />}
      {legalOpen && <LegalModal type={legalOpen} onClose={() => setLegalOpen(null)} />}

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
