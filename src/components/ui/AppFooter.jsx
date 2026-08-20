export default function AppFooter({ onOpenLegal }) {
  return <footer className="creator-credit">
    <div className="footer-creator"><span>Creator</span><strong>Soumya Pal</strong></div>
    <nav aria-label="Legal information"><button onClick={() => onOpenLegal('privacy')}>Privacy Policy</button><i aria-hidden="true"/><button onClick={() => onOpenLegal('terms')}>Terms & Conditions</button></nav>
  </footer>;
}
