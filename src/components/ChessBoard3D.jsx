import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FILES, PIECE_GLYPHS } from '../lib/chessEngine';

function GridSprite({ text, position }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ebf7ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 150px sans-serif';
    ctx.fillText(text, 128, 135);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [text]);

  return (
    <sprite position={position} scale={[0.45, 0.45, 0.45]}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function BoardCoordinates() {
  return (
    <group>
      {FILES.map((file, index) => {
        const x = index - 3.5;
        return <GridSprite key={`file-${file}`} text={file} position={[x, 0.36, 4.62]} />;
      })}

      {Array.from({ length: 8 }, (_, index) => {
        const rank = String(8 - index);
        const z = index - 3.5;
        return <GridSprite key={`rank-${rank}`} text={rank} position={[-4.62, 0.36, z]} />;
      })}
    </group>
  );
}

function PieceSprite({ piece, palette }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    const glyph = PIECE_GLYPHS[piece.color][piece.type];
    ctx.fillStyle = piece.color === 'w' ? palette.white : palette.black;
    ctx.strokeStyle = piece.color === 'w' ? '#202631' : '#f4f7fb';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '210px serif';
    ctx.shadowColor = piece.color === 'w' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.48)';
    ctx.shadowBlur = piece.color === 'w' ? 18 : 11;
    ctx.shadowOffsetX = 7;
    ctx.shadowOffsetY = 9;
    ctx.strokeText(glyph, 128, 132);
    ctx.fillText(glyph, 128, 132);
    return new THREE.CanvasTexture(canvas);
  }, [palette, piece]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={[0, 0.43, 0]} scale={[0.72, 0.72, 0.72]}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function BoardModel() {
  return (
    <group>
      <mesh receiveShadow>
        <boxGeometry args={[8.8, 0.34, 8.8]} />
        <meshStandardMaterial color="#080b10" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[8.28, 0.16, 8.28]} />
        <meshStandardMaterial color="#202832" metalness={0.6} roughness={0.26} />
      </mesh>
    </group>
  );
}

const MODEL_ROOT = import.meta.env.BASE_URL;
const PIECE_MODELS = {
  p: `${MODEL_ROOT}pawn/scene.gltf`,
  r: `${MODEL_ROOT}rook/scene.gltf`,
  n: `${MODEL_ROOT}knight/scene.gltf`,
  b: `${MODEL_ROOT}bishop/scene.gltf`,
  q: `${MODEL_ROOT}queen/scene.gltf`,
  k: `${MODEL_ROOT}king/scene.gltf`,
};

const PIECE_HEIGHTS = { p: 0.88, r: 1.05, n: 1.12, b: 1.18, q: 1.3, k: 1.38 };

function ChessPieceModel({ type, color, palette, selected, moveOffset = { x: 0, z: 0 } }) {
  const { scene } = useGLTF(PIECE_MODELS[type]);
  const pieceColor = color === 'w' ? palette.white : palette.black;
  const animatedGroup = useRef();

  const { model, scale, position } = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const fittedScale = Math.min(0.76 / Math.max(size.x, size.z), PIECE_HEIGHTS[type] / size.y);

    return {
      model: clone,
      scale: fittedScale,
      position: [-center.x * fittedScale, 0.41 - bounds.min.y * fittedScale, -center.z * fittedScale],
    };
  }, [scene, type]);

  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: pieceColor,
    emissive: pieceColor,
    emissiveIntensity: color === 'w' ? 0.14 : 0.05,
    metalness: color === 'w' ? 0.62 : 0.88,
    roughness: 0.09,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.8,
    transparent: false,
    opacity: 1,
    transmission: 0,
    depthWrite: true,
    depthTest: true,
    alphaTest: 0,
  }), [color, pieceColor]);

  useLayoutEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.material = material;
      child.material.transparent = false;
      child.material.opacity = 1;
      child.material.transmission = 0;
      child.material.depthWrite = true;
      child.castShadow = color === 'w';
      child.receiveShadow = true;
    });
  }, [material, model]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    if (!animatedGroup.current) return;
    const ease = 1 - Math.exp(-10 * delta);
    animatedGroup.current.position.x = THREE.MathUtils.lerp(animatedGroup.current.position.x, 0, ease);
    animatedGroup.current.position.z = THREE.MathUtils.lerp(animatedGroup.current.position.z, 0, ease);
    animatedGroup.current.position.y = THREE.MathUtils.lerp(
      animatedGroup.current.position.y,
      selected ? 0.22 : 0,
      ease,
    );
  });

  return (
    <group ref={animatedGroup} position={[moveOffset.x, moveOffset.x || moveOffset.z ? 0.2 : 0, moveOffset.z]}>
      <primitive object={model} scale={scale} position={position} />
    </group>
  );
}

Object.values(PIECE_MODELS).forEach((path) => useGLTF.preload(path));

const DEMO_MOVES = {
  k: [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((z) => [x, z])).filter(([x, z]) => x || z),
  q: [-2, -1, 1, 2].flatMap((step) => [[step, 0], [0, step], [step, step], [step, -step]]),
  r: [-2, -1, 1, 2].flatMap((step) => [[step, 0], [0, step]]),
  b: [-2, -1, 1, 2].flatMap((step) => [[step, step], [step, -step]]),
  n: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
  p: [[0, -1], [0, -2], [-1, -1], [1, -1]],
};

function DemoAnimatedPiece({ type, palette, moves }) {
  const animatedPiece = useRef();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!animatedPiece.current || !moves.length) return;
    elapsed.current += delta;
    const duration = 2.2;
    const targetIndex = Math.floor(elapsed.current / duration) % moves.length;
    const phase = (elapsed.current % duration) / duration;
    const rawProgress = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    const [targetX, targetZ] = moves[targetIndex];
    animatedPiece.current.position.x = targetX * progress;
    animatedPiece.current.position.z = targetZ * progress;
    animatedPiece.current.position.y = Math.sin(Math.PI * progress) * 0.28;
  });

  useEffect(() => {
    elapsed.current = 0;
    animatedPiece.current?.position.set(0, 0, 0);
  }, [type]);

  return (
    <group ref={animatedPiece}>
      <ChessPieceModel type={type} color="w" palette={palette} selected={false} />
    </group>
  );
}

export function PieceMoveDemo3D({ type, palette }) {
  const moves = DEMO_MOVES[type] || [];

  return (
    <div className="piece-demo-canvas">
      <Canvas camera={{ position: [4.8, 6.2, 5.2], fov: 44 }} shadows>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 7, 4]} intensity={2.1} castShadow />
        <group rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[5.35, 0.22, 5.35]} />
            <meshStandardMaterial color="#11151b" metalness={0.5} roughness={0.3} />
          </mesh>
          {Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (__, col) => {
            const x = col - 2;
            const z = row - 2;
            const isMove = moves.some(([moveX, moveZ]) => moveX === x && moveZ === z);
            return (
              <mesh key={`${x}-${z}`} position={[x, 0.24, z]} receiveShadow>
                <boxGeometry args={[0.96, 0.12, 0.96]} />
                <meshStandardMaterial
                  color={isMove ? '#43d68b' : (row + col) % 2 ? palette.darkTile : palette.lightTile}
                  metalness={0.35}
                  roughness={0.3}
                  emissive={isMove ? '#0b5a39' : '#000000'}
                  emissiveIntensity={isMove ? 0.35 : 0}
                />
              </mesh>
            );
          }))}
          <Suspense fallback={null}>
            <DemoAnimatedPiece type={type} palette={palette} moves={moves} />
          </Suspense>
        </group>
        <OrbitControls
          enablePan={false}
          minDistance={7}
          maxDistance={11}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 2.3}
        />
      </Canvas>
    </div>
  );
}

const RULE_SCENES = {
  checkmate: {
    targets: [[0, 0]],
    actors: [
      { type: 'k', color: 'b', from: [0, -1], to: [0, -1], static: true },
      { type: 'q', color: 'w', from: [2, 1], to: [0, 0] },
      { type: 'r', color: 'w', from: [-2, -2], to: [-2, -2], static: true },
    ],
  },
  castling: {
    targets: [[0, 2], [-1, 2]],
    actors: [
      { type: 'k', color: 'w', from: [-2, 2], to: [0, 2] },
      { type: 'r', color: 'w', from: [2, 2], to: [-1, 2] },
    ],
  },
  promotion: {
    targets: [[0, -2]],
    actors: [{ type: 'p', color: 'w', from: [0, 2], to: [0, -2] }],
  },
  enpassant: {
    targets: [[0, -1]],
    actors: [
      { type: 'p', color: 'w', from: [-1, 0], to: [0, -1] },
      { type: 'p', color: 'b', from: [0, 0], to: [0, 0], static: true },
    ],
  },
  draws: {
    targets: [[1, 0]],
    actors: [
      { type: 'k', color: 'w', from: [-1, 1], to: [0, 1] },
      { type: 'k', color: 'b', from: [1, -1], to: [1, 0] },
    ],
  },
  controls: {
    targets: [[1, -2]],
    actors: [{ type: 'n', color: 'w', from: [0, 0], to: [1, -2] }],
  },
};

function RuleAnimatedPiece({ actor, palette }) {
  const group = useRef();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (actor.static) {
      group.current.position.set(actor.from[0], 0, actor.from[1]);
      return;
    }
    elapsed.current += delta;
    const phase = (elapsed.current % 2.8) / 2.8;
    const raw = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    const progress = raw * raw * (3 - 2 * raw);
    group.current.position.x = THREE.MathUtils.lerp(actor.from[0], actor.to[0], progress);
    group.current.position.z = THREE.MathUtils.lerp(actor.from[1], actor.to[1], progress);
    group.current.position.y = Math.sin(Math.PI * progress) * 0.25;
  });

  return (
    <group ref={group} position={[actor.from[0], 0, actor.from[1]]}>
      <ChessPieceModel type={actor.type} color={actor.color} palette={palette} selected={false} />
    </group>
  );
}

function PromotionAnimatedPiece({ promotionType, palette }) {
  const pawnGroup = useRef();
  const promotedGroup = useRef();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!pawnGroup.current || !promotedGroup.current) return;
    elapsed.current += delta;
    const phase = (elapsed.current % 3.2) / 3.2;
    const movingPhase = Math.min(phase / 0.62, 1);
    const progress = movingPhase * movingPhase * (3 - 2 * movingPhase);

    pawnGroup.current.position.set(
      0,
      Math.sin(Math.PI * progress) * 0.22,
      THREE.MathUtils.lerp(2, -2, progress),
    );
    pawnGroup.current.visible = phase < 0.62;
    promotedGroup.current.visible = phase >= 0.62;
  });

  useEffect(() => {
    elapsed.current = 0;
  }, [promotionType]);

  return (
    <>
      <group ref={pawnGroup} position={[0, 0, 2]}>
        <ChessPieceModel type="p" color="w" palette={palette} selected={false} />
      </group>
      <group ref={promotedGroup} position={[0, 0, -2]} visible={false}>
        <ChessPieceModel type={promotionType} color="w" palette={palette} selected={false} />
      </group>
    </>
  );
}

export function RuleMoveDemo3D({ rule, palette, promotionType = 'q' }) {
  const scene = RULE_SCENES[rule] || RULE_SCENES.controls;
  return (
    <div className="piece-demo-canvas">
      <Canvas camera={{ position: [4.8, 6.2, 5.2], fov: 44 }} shadows>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 7, 4]} intensity={2.1} castShadow />
        <group rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[5.35, 0.22, 5.35]} />
            <meshStandardMaterial color="#11151b" metalness={0.5} roughness={0.3} />
          </mesh>
          {Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (__, col) => {
            const x = col - 2;
            const z = row - 2;
            const highlighted = scene.targets.some(([targetX, targetZ]) => targetX === x && targetZ === z);
            return (
              <mesh key={`${x}-${z}`} position={[x, 0.24, z]} receiveShadow>
                <boxGeometry args={[0.96, 0.12, 0.96]} />
                <meshStandardMaterial color={highlighted ? '#f0a84a' : (row + col) % 2 ? palette.darkTile : palette.lightTile} />
              </mesh>
            );
          }))}
          <Suspense fallback={null}>
            {rule === 'promotion'
              ? <PromotionAnimatedPiece promotionType={promotionType} palette={palette} />
              : scene.actors.map((actor, index) => <RuleAnimatedPiece key={`${rule}-${index}`} actor={actor} palette={palette} />)}
          </Suspense>
        </group>
        <OrbitControls enablePan={false} minDistance={7} maxDistance={11} minPolarAngle={Math.PI / 3.5} maxPolarAngle={Math.PI / 2.3} />
      </Canvas>
    </div>
  );
}

function CapturedPieceGroup({ pieces, color, palette, x }) {
  return (
    <group position={[x, -0.07, 0]}>
      {pieces.map((piece, index) => {
        const centeredZ = (index - (pieces.length - 1) / 2) * 0.46;
        return (
          <group
            key={`${color}-${piece.type}-${index}`}
            position={[0, 0.04, centeredZ]}
            scale={0.4}
          >
            <Suspense fallback={null}>
              <ChessPieceModel type={piece.type} color={color} palette={palette} selected={false} />
            </Suspense>
          </group>
        );
      })}
    </group>
  );
}

function CapturedPiecesDisplay({ capturedPieces, palette, playerColor }) {
  const whitePieces = capturedPieces.filter((piece) => piece.color === 'w');
  const blackPieces = capturedPieces.filter((piece) => piece.color === 'b');
  const boardRotation = Math.PI / 4 + (playerColor === 'b' ? Math.PI : 0);
  const localSide = playerColor === 'b' ? -5.55 : 5.55;
  const alignedPosition = [
    Math.cos(boardRotation) * localSide,
    0.31,
    -Math.sin(boardRotation) * localSide,
  ];

  return (
    <group
      position={alignedPosition}
      rotation={[0, boardRotation, 0]}
    >
      <mesh receiveShadow castShadow>
        <boxGeometry args={[1.05, 0.14, 6.6]} />
        <meshPhysicalMaterial
          color="#f7f8fb"
          metalness={0.1}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <CapturedPieceGroup pieces={whitePieces} color="w" palette={palette} x={-0.31} />
      <CapturedPieceGroup pieces={blackPieces} color="b" palette={palette} x={0.31} />
    </group>
  );
}

function BoardTile({ x, z, isDark, selected, moveTarget, kingInCheck, piece, moveOffset, onClick, palette, showPossibleMoves, topView }) {
  const tileColor = isDark ? palette.darkTile : palette.lightTile;
  const highlightColor = kingInCheck ? '#e3263f' : selected ? '#ffd166' : moveTarget ? '#7ef9ff' : tileColor;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.31, 0]} onClick={onClick} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.16, 0.98]} />
        <meshStandardMaterial color={highlightColor} metalness={0.55} roughness={0.24} />
      </mesh>

      {showPossibleMoves && moveTarget && (
        <mesh position={[0, 0.405, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 32]} />
          <meshBasicMaterial color="#dff9ff" transparent opacity={0.9} />
        </mesh>
      )}

      {kingInCheck && (
        <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.36, 0.47, 48]} />
          <meshBasicMaterial color="#ff7080" transparent opacity={0.95} depthWrite={false} />
        </mesh>
      )}

      {piece && !topView && (
        <mesh position={[0, 0.402, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.34, 40]} />
          <meshBasicMaterial
            color={piece.color === 'w' ? '#02040a' : '#ffffff'}
            transparent
            opacity={piece.color === 'w' ? 0.42 : 0.2}
            depthWrite={false}
            blending={piece.color === 'w' ? THREE.NormalBlending : THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {piece && topView && <PieceSprite piece={piece} palette={palette} />}

      {piece && !topView && (
        <Suspense fallback={null}>
          <ChessPieceModel
            type={piece.type}
            color={piece.color}
            palette={palette}
            selected={selected}
            moveOffset={moveOffset}
          />
        </Suspense>
      )}

    </group>
  );
}

export default function ChessBoard3D({ board, selectedSquare, legalMoves, onSquareClick, palette, showGrid, showPossibleMoves, playerColor, capturedPieces, topView, checkedKingSquare }) {
  const previousBoard = useRef(board);
  const boardMatrix = useMemo(() => {
    return board.flatMap((row, rowIndex) =>
      row.map((piece, colIndex) => {
        const squareName = `${FILES[colIndex]}${8 - rowIndex}`;
        return {
          squareName,
          piece,
          x: colIndex - 3.5,
          z: rowIndex - 3.5,
        };
      }),
    );
  }, [board]);

  const moveOffsets = useMemo(() => {
    const offsets = {};
    const previous = previousBoard.current;
    if (previous === board) return offsets;

    const changed = [];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const before = previous[row][col];
        const after = board[row][col];
        if (before?.type !== after?.type || before?.color !== after?.color) {
          changed.push({ row, col, before, after });
        }
      }
    }

    const source = changed.find(({ before, after }) => before && !after);
    const target = changed.find(({ after }) => (
      after && source?.before?.type === after.type && source.before.color === after.color
    ));

    if (source && target) {
      const targetSquare = `${FILES[target.col]}${8 - target.row}`;
      offsets[targetSquare] = {
        x: source.col - target.col,
        z: source.row - target.row,
      };
    }

    return offsets;
  }, [board]);

  useEffect(() => {
    previousBoard.current = board;
  }, [board]);

  return (
    <div className="board-3d-wrapper">
      <Canvas
        key={topView ? 'top-view' : 'perspective-view'}
        camera={{ position: [0, 9, 10.5], fov: 48 }}
        shadows
      >
        {topView && (
          <OrthographicCamera
            makeDefault
            position={[0, 18, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            zoom={47}
          />
        )}
        <ambientLight intensity={0.95} />
        <directionalLight
          position={[4, 8, 5]}
          intensity={2.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0004}
          shadow-normalBias={0.025}
        />
        <group rotation={[
          0,
          topView
            ? (playerColor === 'b' ? Math.PI : 0)
            : Math.PI / 4 + (playerColor === 'b' ? Math.PI : 0),
          0,
        ]}>
          <BoardModel />
          {boardMatrix.map(({ squareName, piece, x, z }, index) => {
            const isDark = (Math.floor((x + 3.5) + (z + 3.5)) % 2) === 1;
            const moveTarget = legalMoves.some((move) => move.to === squareName);
            const selected = selectedSquare === squareName;
            const kingInCheck = checkedKingSquare === squareName;

            return (
              <BoardTile
                key={`${squareName}-${index}`}
                x={x}
                z={z}
                isDark={isDark}
                selected={selected}
                moveTarget={moveTarget}
                kingInCheck={kingInCheck}
                piece={piece}
                moveOffset={moveOffsets[squareName]}
                palette={palette}
                showPossibleMoves={showPossibleMoves}
                topView={topView}
                onClick={() => onSquareClick(squareName)}
              />
            );
          })}
          {showGrid && <BoardCoordinates />}
        </group>
        {!topView && (
          <CapturedPiecesDisplay capturedPieces={capturedPieces} palette={palette} playerColor={playerColor} />
        )}
        {!topView && (
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.65}
            minDistance={10.5}
            maxDistance={19}
            target={[0, 0.25, 0]}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 2.2}
          />
        )}
      </Canvas>
    </div>
  );
}
