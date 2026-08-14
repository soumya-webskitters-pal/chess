import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { FILES } from '../lib/chessEngine';

const CHESS_MODEL_URL = new URL('../../chess-model/scene.gltf', import.meta.url).href;

const PIECE_NAME_MAP = {
  p: ['pawn.001_31', 'pawn_23', 'pawn.003_29', 'pawn.011_9', 'pawn.012_3'],
  r: ['rook_25', 'rook.001_26', 'rook.002_5', 'rook.003_6'],
  n: ['knight_22', 'knight.001_27', 'knight.002_1', 'knight.003_2'],
  b: ['bishop.001_20', 'bishop.002_28', 'bishop.003_0', 'bishop_8'],
  q: ['queen_24', 'queen.001_4'],
  k: ['king_21'],
};

function cloneModelNode(node) {
  if (!node) return null;
  const clone = node.clone(true);
  clone.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return clone;
}

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

function BoardModel() {
  const { scene } = useGLTF(CHESS_MODEL_URL);

  const boardNode = useMemo(() => {
    const node = scene.getObjectByName('bord_16');
    return cloneModelNode(node);
  }, [scene]);

  if (!boardNode) return null;

  return <primitive object={boardNode} scale={3.2} position={[0, -0.12, 0]} />;
}

function PieceModel({ type, color }) {
  const { scene } = useGLTF(CHESS_MODEL_URL);

  const modelNode = useMemo(() => {
    const names = PIECE_NAME_MAP[type] || [];
    const match = names.find((name) => scene.getObjectByName(name));
    const baseNode = match ? scene.getObjectByName(match) : null;
    const clone = cloneModelNode(baseNode);

    if (!clone) return null;

    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const material = child.material.clone();
        const tone = color === 'w' ? '#f3f7ff' : '#1a2333';
        material.color = new THREE.Color(tone);
        material.emissive = new THREE.Color(color === 'w' ? '#dfeafe' : '#060b14');
        material.emissiveIntensity = 0.18;
        child.material = material;
      }
    });

    return clone;
  }, [color, scene, type]);

  if (!modelNode) return null;

  return (
    <group position={[0, 0.18, 0]} rotation={[0, Math.PI, 0]} scale={[1.1, 1.1, 1.1]}>
      <primitive object={modelNode} />
    </group>
  );
}

function BoardTile({ x, z, isDark, selected, moveTarget, piece, onClick, palette, showGrid, showPossibleMoves }) {
  const tileColor = isDark ? palette.darkTile : palette.lightTile;
  const highlightColor = selected ? '#ffd166' : moveTarget ? '#7ef9ff' : tileColor;

  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={onClick} castShadow receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={highlightColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {showPossibleMoves && moveTarget && (
        <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 32]} />
          <meshBasicMaterial color="#dff9ff" transparent opacity={0.9} />
        </mesh>
      )}

      {piece && <PieceModel type={piece.type} color={piece.color} />}

      {showGrid && z === -3.5 && (
        <GridSprite text={FILES[Math.round(x + 3.5)] || ''} position={[-0.34, 0.11, -0.18]} />
      )}

      {showGrid && x === -3.5 && (
        <GridSprite text={String(8 - Math.round(z + 3.5))} position={[-0.18, 0.11, 0.34]} />
      )}
    </group>
  );
}

export default function ChessBoard3D({ board, selectedSquare, legalMoves, onSquareClick, palette, showGrid, showPossibleMoves }) {
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

  return (
    <div className="board-3d-wrapper">
      <Canvas camera={{ position: [0, 7.5, 7.2], fov: 45 }} shadows>
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 7, 4]} intensity={1.8} castShadow />
        <group rotation={[0, Math.PI / 4, 0]}>
          <BoardModel />
          {boardMatrix.map(({ squareName, piece, x, z }, index) => {
            const isDark = (Math.floor((x + 3.5) + (z + 3.5)) % 2) === 1;
            const moveTarget = legalMoves.some((move) => move.to === squareName);
            const selected = selectedSquare === squareName;

            return (
              <BoardTile
                key={`${squareName}-${index}`}
                x={x}
                z={z}
                isDark={isDark}
                selected={selected}
                moveTarget={moveTarget}
                piece={piece}
                palette={palette}
                showGrid={showGrid}
                showPossibleMoves={showPossibleMoves}
                onClick={() => onSquareClick(squareName)}
              />
            );
          })}
        </group>
        <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}
