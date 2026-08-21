import { useState } from 'react';

export default function OnlineLobby({ online, onClose }) {
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('room') || 'chess-');
  const share = async () => {
    const SHARE_TEXT = 'Play chess with me live!';
    const APK_URL = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(online.roomCode)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quantum Board',
          text: SHARE_TEXT,
          url: APK_URL,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${APK_URL}`);
    }
  };
  const busy = ['creating', 'waiting', 'joining'].includes(online.status);

  return <div className="online-overlay" onClick={onClose}><section className="online-lobby-modal glass-panel" onClick={(e) => e.stopPropagation()}>
    <header><div><p className="eyebrow">Peer-to-peer match</p><h2>Play online</h2></div><button className="icon-button" onClick={onClose}>✕</button></header>
    {online.status === 'playing' ? <div className="online-connected"><span className="live-dot"/><div><strong>Friend connected</strong><small>You play {online.playerColor === 'w' ? 'White' : 'Black'} · room {online.roomCode}</small></div><button onClick={onClose}>ENTER BOARD</button></div> : <>
      <button className="create-room-button" onClick={online.host} disabled={busy}>Create a room</button>
      {['creating', 'waiting'].includes(online.status) && <div className="room-code-card"><small>SHARE THIS CODE</small><strong>{online.roomCode}</strong><div><button onClick={() => navigator.clipboard?.writeText(online.roomCode)}>COPY</button><button onClick={share}>SHARE LINK</button></div><p>Waiting for your friend…</p></div>}
      {!['creating', 'waiting'].includes(online.status) && <div className="join-room-row"><span>OR JOIN A FRIEND</span><div><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="chess-xxxxxx" maxLength="32"/><button onClick={() => online.join(code)} disabled={!code.trim() || busy}>{online.status === 'joining' ? 'JOINING…' : 'JOIN'}</button></div></div>}
      {online.error && <p className="online-error">{online.error}</p>}
    </>}
  </section></div>;
}
