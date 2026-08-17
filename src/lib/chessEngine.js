import { Chess } from "chess.js";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const CENTER_CONTROL = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 5, 0, 0, 10, 20, 25, 25, 20, 10,
  0, 0, 10, 25, 35, 35, 25, 10, 0, 0, 10, 25, 35, 35, 25, 10, 0, 0, 10, 20, 25,
  25, 20, 10, 0, 0, 5, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const PIECE_SQUARE_TABLES = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 45, 45, 45, 45, 45, 45, 45, 45, 5, 10, 15, 20, 20,
    15, 10, 5, 2, 8, 12, 18, 18, 12, 8, 2, 0, 5, 8, 15, 15, 8, 5, 0, 2, 4, 5,
    10, 10, 5, 4, 2, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -30, -20, -20, -15, -15, -20, -20, -30, -20, -5, 0, 0, 0, 0, -5, -20, -20,
    0, 8, 12, 12, 8, 0, -20, -15, 4, 12, 16, 16, 12, 4, -15, -15, 0, 12, 16, 16,
    12, 0, -15, -20, -4, 8, 10, 10, 8, -4, -20, -20, -10, -2, 0, 0, -2, -10,
    -20, -30, -20, -20, -15, -15, -20, -20, -30,
  ],
  b: [
    -20, -15, -15, -15, -15, -15, -15, -20, -15, 2, 5, 8, 8, 5, 2, -15, -15, 4,
    10, 12, 12, 10, 4, -15, -15, 6, 12, 16, 16, 12, 6, -15, -15, 5, 12, 16, 16,
    12, 5, -15, -15, 3, 8, 10, 10, 8, 3, -15, -15, 0, 4, 5, 5, 4, 0, -15, -20,
    -15, -15, -15, -15, -15, -15, -20,
  ],
  r: [
    0, 0, 0, 4, 4, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
    -5, 5, 8, 8, 8, 8, 8, 8, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  q: [
    -20, -15, -15, -10, -10, -15, -15, -20, -15, 0, 5, 5, 5, 5, 0, -15, -15, 5,
    8, 8, 8, 8, 5, -15, -10, 5, 8, 12, 12, 8, 5, -10, -10, 5, 8, 12, 12, 8, 5,
    -10, -15, 5, 8, 8, 8, 8, 5, -15, -15, 0, 5, 5, 5, 5, 0, -15, -20, -15, -15,
    -10, -10, -15, -15, -20,
  ],
  k: [
    -40, -30, -30, -25, -25, -30, -30, -40, -30, -15, -10, -5, -5, -10, -15,
    -30, -30, -10, 5, 10, 10, 5, -10, -30, -30, -10, 10, 15, 15, 10, -10, -30,
    -30, -10, 10, 15, 15, 10, -10, -30, -30, -10, 5, 10, 10, 5, -10, -30, -20,
    -5, 0, 0, 0, 0, -5, -20, -30, -15, -10, -5, -5, -10, -15, -30,
  ],
};

export const PALETTE_MAP = {
  classic: {
    white: "#f3f4f8",
    black: "#171d2e",
    lightTile: "#f4f4f2",
    darkTile: "#34383d",
    accent: "#69d2ff",
  },
  gold: {
    white: "#ffe29a",
    black: "#604715",
    lightTile: "#f3e4a1",
    darkTile: "#604715",
    accent: "#ffd166",
  },
  neon: {
    white: "#dfff4f",
    black: "#ff4fd8",
    lightTile: "#dfffd8",
    darkTile: "#4a0d6d",
    accent: "#7ef9ff",
  },
};

export const PIECE_GLYPHS = {
  w: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
  b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
};

export const AI_DIFFICULTY = {
  easy: { label: "Easy", searchDepth: 1, aggression: 0.85 },
  hard: { label: "Hard", searchDepth: 3, aggression: 1.35 },
};

const OPENING_PREFERENCES = new Set([
  "e4",
  "d4",
  "c4",
  "Nf3",
  "Nc3",
  "f3",
  "g3",
  "e5",
  "d5",
  "c5",
  "Nf6",
  "Nc6",
]);

export function cloneGame(game) {
  return new Chess(game.fen());
}

export function getLegalMoves(game, square) {
  return square ? game.moves({ square, verbose: true }) : [];
}

function getSquareIndex(square) {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return rank * 8 + file;
}

function getPositionBonus(piece) {
  const table = PIECE_SQUARE_TABLES[piece.type];
  if (!table) return 0;

  const square = piece.square ?? "e4";
  const idx = getSquareIndex(square);
  const whitePerspective = piece.color === "w" ? idx : 63 - idx;
  return table[whitePerspective] ?? 0;
}

function getMobilityScore(game, sideToMove) {
  const ownMoves = game.moves({ verbose: true }).length;
  const otherSide = sideToMove === "w" ? "b" : "w";
  const enemyKing = game
    .board()
    .flat()
    .find((piece) => piece && piece.type === "k" && piece.color === otherSide);

  const tempGame = cloneGame(game);
  const enemyMoves = tempGame.moves({ verbose: true }).length;

  const mobilityDelta = ownMoves - enemyMoves;
  const kingInDanger = enemyKing ? 2 : 0;

  return mobilityDelta * 4 + kingInDanger;
}

export function evaluateBoard(game) {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -99999 : 99999;
  }

  if (game.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  board.forEach((row) => {
    row.forEach((piece) => {
      if (!piece) return;

      const baseValue = PIECE_VALUES[piece.type] || 0;
      const positionBonus = getPositionBonus(piece);
      const centerBonus =
        CENTER_CONTROL[piece.square ? getSquareIndex(piece.square) : 0] || 0;
      const signed = piece.color === "w" ? 1 : -1;

      score += signed * (baseValue + positionBonus + centerBonus * 0.5);
    });
  });

  const mobilityScore = getMobilityScore(game, game.turn());
  return score + mobilityScore;
}

function getMovePriority(move, difficulty = "easy") {
  const hardMultiplier = difficulty === "hard" ? 1.4 : 1;
  let score = 0;

  if (move.captured) score += PIECE_VALUES[move.captured] || 0;
  if (move.flags.includes("p")) score += 150 * hardMultiplier;
  if (move.flags.includes("k") || move.flags.includes("q"))
    score += 120 * hardMultiplier;
  if (move.san.includes("+")) score += 220 * hardMultiplier;
  if (move.san.includes("#")) score += 400 * hardMultiplier;

  if (difficulty === "hard" && OPENING_PREFERENCES.has(move.san)) {
    score += 60;
  }

  return score;
}

export function learnPlayerStyle(history, playerColor) {
  const moves = history.filter((move) => move.color === playerColor);
  if (!moves.length) return null;
  const ratio = (predicate) => moves.filter(predicate).length / moves.length;
  return {
    capture: ratio((move) => Boolean(move.captured)),
    check: ratio((move) => move.san?.includes("+") || move.san?.includes("#")),
    pawn: ratio((move) => move.piece === "p"),
    castle: ratio((move) => move.flags?.includes("k") || move.flags?.includes("q")),
    center: ratio((move) => ["c3", "c4", "c5", "c6", "d3", "d4", "d5", "d6", "e3", "e4", "e5", "e6", "f3", "f4", "f5", "f6"].includes(move.to)),
  };
}

function getStyleAffinity(move, style) {
  if (!style) return 0;
  let score = 0;
  if (move.captured) score += 85 * style.capture;
  if (move.san.includes("+") || move.san.includes("#")) score += 75 * style.check;
  if (move.piece === "p") score += 32 * style.pawn;
  if (move.flags.includes("k") || move.flags.includes("q")) score += 90 * style.castle;
  if (["c3", "c4", "c5", "c6", "d3", "d4", "d5", "d6", "e3", "e4", "e5", "e6", "f3", "f4", "f5", "f6"].includes(move.to)) score += 38 * style.center;
  return score;
}

export function getBestMove(game, depth = 3, difficulty = "easy", playerStyle = null) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  const maximizing = game.turn() === "w";

  const orderedMoves = [...moves].sort(
    (a, b) => getMovePriority(b, difficulty) - getMovePriority(a, difficulty),
  );

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = orderedMoves[0];

  for (const move of orderedMoves) {
    const next = cloneGame(game);
    next.move({ from: move.from, to: move.to, promotion: "q" });
    const strategicScore = minimax(
      next,
      depth - 1,
      !maximizing,
      -Infinity,
      Infinity,
      difficulty,
    );
    const styleAffinity = getStyleAffinity(move, playerStyle);
    const score = strategicScore + (maximizing ? styleAffinity : -styleAffinity);

    if ((maximizing && score > bestScore) || (!maximizing && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(game, depth, isMaximizing, alpha, beta, difficulty = "easy") {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = [...game.moves({ verbose: true })].sort(
    (a, b) => getMovePriority(b, difficulty) - getMovePriority(a, difficulty),
  );

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = cloneGame(game);
      next.move({ from: move.from, to: move.to, promotion: "q" });
      const score = minimax(next, depth - 1, false, alpha, beta, difficulty);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = cloneGame(game);
    next.move({ from: move.from, to: move.to, promotion: "q" });
    const score = minimax(next, depth - 1, true, alpha, beta, difficulty);
    best = Math.min(best, score);
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}
