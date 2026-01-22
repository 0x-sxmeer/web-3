import React, { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConnectWalletButton from './ConnectWalletButton';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    }} className="navbar-container">
      <div style={{ fontWeight: 600, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-color)', letterSpacing: '-0.03em' }}>
        <div style={{ width: 28, height: 28, background: '#F0F0F0', borderRadius: '50%'}}></div>
        NEBULA LABS
      </div>

      {/* Desktop Menu */}
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', fontSize: '0.9rem', fontWeight: 500 }} className="desktop-menu">
        <Link to="/" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Home</Link>
        <Link to="/swap" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)' }}>Swap</Link>
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

      <div className="desktop-wallet">
        <ConnectWalletButton />
      </div>

      {/* Mobile Hamburger */}
      <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            background: '#050505',
            borderBottom: '1px solid var(--glass-border)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxSizing: 'border-box'
        }}>
             <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)', fontSize: '1.1rem' }}>Home</Link>
            <Link to="/swap" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)', fontSize: '1.1rem' }}>Swap</Link>
            <a href="#" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-color)', fontSize: '1.1rem' }}>Portfolio</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-color)', fontSize: '1.1rem'}}>
                Our Ecosystem <ChevronDown size={14} />
            </div>
            {/* Mobile Wallet Connect */}
            <div style={{ marginTop: '1rem' }}>
                <ConnectWalletButton />
            </div>
        </div>
      )}

      <style>{`
        .mobile-toggle { display: none; cursor: pointer; color: var(--text-color); }
        .desktop-wallet { display: block; }

        @media (max-width: 1024px) {
            .navbar-container { padding: 15px 20px !important; }
            .desktop-menu { display: none !important; }
            .desktop-wallet { display: none !important; }
            .mobile-toggle { display: block; }
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
