export const LEGAL_CONTENT = {
  privacy: {
    eyebrow: 'Your data',
    title: 'Privacy Policy',
    page: '/privacy.html',
    sections: [
      ['Local game data', 'Quantum Chess stores preferences and completed-game history in your browser. This information stays on your device unless you clear the site data.'],
      ['Online matches', 'Live friend matches use a direct WebRTC connection through PeerJS signaling. Moves, room codes, reactions, and chat messages are used only to operate the current match.'],
      ['Messages and reactions', 'Chat messages and reactions travel between the two players and are not added to local match history. Avoid sharing sensitive personal information in chat.'],
      ['Accounts and tracking', 'Quantum Chess does not require an account and does not currently include advertising or behavioral analytics.'],
      ['Contact', 'For privacy questions, contact the creator, Soumya Pal. Last updated: August 20, 2026.'],
    ],
  },
  terms: {
    eyebrow: 'Fair play',
    title: 'Terms & Conditions',
    page: '/terms.html',
    sections: [
      ['Using the game', 'Quantum Chess is provided for personal entertainment. You may play against the AI, locally, or with a friend online.'],
      ['Player conduct', 'Do not use chat, reactions, room codes, or online play to harass others, distribute unlawful material, or interfere with the service.'],
      ['Online availability', 'Online matches depend on internet connectivity, compatible browsers, PeerJS signaling, and network policies. Uninterrupted availability is not guaranteed.'],
      ['No warranty', 'The game is provided as is. The creator is not responsible for lost local history, interrupted matches, or disputes between players.'],
      ['Changes', 'Features and these terms may change as the game evolves. Last updated: August 20, 2026.'],
    ],
  },
};

export default function LegalModal({ type, onClose }) {
  const content = LEGAL_CONTENT[type];
  if (!content) return null;
  return <div className="legal-overlay" onClick={onClose} role="presentation"><section className="legal-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={(event) => event.stopPropagation()}>
    <header><div><p className="eyebrow">{content.eyebrow}</p><h2 id="legal-title">{content.title}</h2></div><button className="icon-button" onClick={onClose} aria-label={`Close ${content.title}`}>✕</button></header>
    <div className="legal-content">{content.sections.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>
    <footer><a href={content.page} target="_blank" rel="noreferrer">Open full {content.title} page <span>↗</span></a><button onClick={onClose}>Done</button></footer>
  </section></div>;
}
