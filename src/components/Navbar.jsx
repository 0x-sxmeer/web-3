import React from 'react';
import { ChevronDown } from 'lucide-react';
import ConnectWalletButton from './ConnectWalletButton';

const Navbar = () => {
  return (
    <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '19px 40px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--glass-border)'
    }}>
      <div style={{ fontWeight: 600, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-color)', letterSpacing: '-0.03em' }}>
        <div style={{ width: 28, height: 28, background: '#F0F0F0', borderRadius: '50%'}}></div>
        LABS
      </div>

      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', fontSize: '0.9rem', fontWeight: 500 }} className="desktop-menu">
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Our Programs</a>
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Portfolio</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-color)'}}>
          Our Ecosystem <ChevronDown size={14} />
        </div>
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Media</a>
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Reviews</a>
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Team</a>
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>FAQ</a>
        <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Blog</a>
      </div>

      <ConnectWalletButton />

      <style>{`
        @media (max-width: 1024px) {
            .desktop-menu { display: none !important; }
        }
        .nav-link:hover {
            color: var(--accent-color) !important;
            transition: color 0.2s;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
