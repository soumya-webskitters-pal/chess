import { useCallback, useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';

const cleanCode = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);

export default function useOnlineChess() {
  const [status, setStatus] = useState('idle');
  const [roomCode, setRoomCode] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const closingRef = useRef(false);

  const emit = useCallback((payload) => setEvent({ ...payload, eventId: `${Date.now()}-${Math.random()}` }), []);

  const close = useCallback((notify = false) => {
    closingRef.current = true;
    if (notify && connectionRef.current?.open) connectionRef.current.send({ type: 'leave' });
    connectionRef.current?.close();
    peerRef.current?.destroy();
    connectionRef.current = null;
    peerRef.current = null;
    setStatus('idle');
    setRoomCode('');
    setPlayerColor(null);
    setError('');
  }, []);

  const wire = useCallback((connection, host) => {
    connectionRef.current = connection;
    connection.on('open', () => {
      closingRef.current = false;
      const color = host ? 'w' : 'b';
      setPlayerColor(color);
      setStatus('playing');
      setError('');
      if (host) connection.send({ type: 'start', color: 'b' });
      emit({ type: 'connected', color });
    });
    connection.on('data', (data) => {
      if (!data || typeof data.type !== 'string') return;
      if (data.type === 'start') setPlayerColor(data.color === 'w' ? 'w' : 'b');
      emit(data);
    });
    connection.on('close', () => {
      if (!closingRef.current) {
        setStatus('disconnected');
        emit({ type: 'disconnected' });
      }
    });
    connection.on('error', () => setError('The peer connection was interrupted.'));
  }, [emit]);

  const host = useCallback(() => {
    close();
    closingRef.current = false;
    const code = `chess-${Math.random().toString(36).slice(2, 8)}`;
    const peer = new Peer(code);
    peerRef.current = peer;
    setRoomCode(code);
    setStatus('creating');
    peer.on('open', () => setStatus('waiting'));
    peer.on('connection', (connection) => wire(connection, true));
    peer.on('error', (peerError) => {
      setError(peerError.type === 'unavailable-id' ? 'That room code is unavailable.' : 'Could not create the room. Please retry.');
      setStatus('error');
    });
  }, [close, wire]);

  const join = useCallback((value) => {
    const code = cleanCode(value);
    if (!code) return;
    close();
    closingRef.current = false;
    const peer = new Peer();
    peerRef.current = peer;
    setRoomCode(code);
    setStatus('joining');
    peer.on('open', () => wire(peer.connect(code, { reliable: true }), false));
    peer.on('error', () => {
      setError('Room not found or no longer available.');
      setStatus('error');
    });
  }, [close, wire]);

  const send = useCallback((payload) => {
    if (connectionRef.current?.open) {
      connectionRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  useEffect(() => () => close(), [close]);

  return { status, roomCode, playerColor, event, error, host, join, send, close };
}
