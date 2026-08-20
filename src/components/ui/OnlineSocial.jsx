import { useEffect, useRef, useState } from 'react';

const reactions = [
  '😂', '😭', '💀', '🙏', '🗿', '🫠', '🤡', '🤓',
  '😎', '🥶', '🫡', '🙄', '👀', '💅', '✨', '🫶',
  '🤌', '😮', '🤯', '😬', '🥹', '😏', '😈', '🥴',
  '👏', '🙌', '👍', '👎', '🔥', '💯', '❤️', '💔',
  '🎉', '🤝', '🧢', '🚩', '✅', '❌', '🐐', '🍿',
  '🚀', '💥', '⚡', '🏆', '♟️', '🤫', '😤', '🤨',
];

export default function OnlineSocial({ messages, onSendMessage, onReaction, onLeave }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const endRef = useRef(null);
  const socialRef = useRef(null);
  const messageCountRef = useRef(messages.length);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!socialRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (messages.length > messageCountRef.current && latest && !latest.mine && !open) setUnread(true);
    messageCountRef.current = messages.length;
  }, [messages, open]);
  const submit = (e) => {
    e.preventDefault();
    const value = text.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 80);
    if (!value) return;
    onSendMessage(value);
    setText('');
  };
  return <div className="online-social" ref={socialRef}>
    {open && <aside className="online-social-popup glass-panel">
      <header><strong>Reactions & messages</strong><button onClick={() => setOpen(false)} aria-label="Close chat">✕</button></header>
      <div className="chat-log">{messages.length === 0 ? <p>No messages yet. Say hello!</p> : messages.map((message) => <div key={message.id} className={`chat-message ${message.mine ? 'mine' : 'theirs'}`}><small>{message.mine ? 'YOU' : 'FRIEND'}</small><span>{message.text}</span></div>)}<i ref={endRef}/></div>
      <form className="chat-form" onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value.slice(0, 80))} placeholder="Write a message…" maxLength="80"/><button disabled={!text.trim()}>➤</button></form>
      <div className="reaction-box" aria-label="Send reaction">{reactions.map((emoji) => <button key={emoji} onClick={() => { onReaction(emoji); setOpen(false); }}>{emoji}</button>)}</div>
    </aside>}
    <div className="online-live-controls">
      <div className="online-live-tag"><span className="live-dot"/><strong>ONLINE</strong></div>
      <button className={`online-social-trigger${open ? ' is-open' : ''}`} onClick={() => setOpen((value) => { const next = !value; if (next) setUnread(false); return next; })} aria-expanded={open} aria-label={unread ? 'Open reactions and messages, new message' : 'Open reactions and messages'}>😊{unread && <span className="unread-message-dot" aria-hidden="true"/>}</button>
      <button className="online-exit-button" onClick={onLeave}>Exit</button>
    </div>
  </div>;
}
