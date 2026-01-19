import React from 'react';

const Footer = () => {
  return (
    <footer style={{ padding: '4rem 40px 2rem', background: '#000', borderTop: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr 1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
        <div>
            <div style={{ 
                fontSize: 'clamp(5rem, 15vw, 12rem)', 
                fontFamily: 'var(--font-display)', 
                fontWeight: 700, 
                lineHeight: 0.8,
                letterSpacing: '-0.04em',
                marginBottom: '2rem',
                color: 'var(--text-color)'
            }}>
                LABS
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} style={{ 
                        width: 48, 
                        height: 48, 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}></div>
                ))}
            </div>
        </div>

        <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: 'var(--text-color)', fontWeight: 600 }}>PRODUCT</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.5, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Incubation</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Acceleration</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Investment</a></li>
            </ul>
        </div>

        <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: 'var(--text-color)', fontWeight: 600 }}>RESOURCES</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.5, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Brand Kit</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a></li>
            </ul>
        </div>
        
        <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: 'var(--text-color)', fontWeight: 600 }}>CONTACT</h4>
             <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.5, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Apply</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Email Us</a></li>
            </ul>
        </div>
      </div>

      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.8rem', 
          opacity: 0.5, 
          paddingTop: '2rem', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontFamily: 'Roboto Mono, monospace',
          color: 'var(--text-muted)'
      }}>
        <div>&copy; 2024 ChainGPT Labs. All rights reserved.</div>
        <div>
            Privacy Policy &nbsp;|&nbsp; Terms of Service
        </div>
      </div>
    </footer>
  );
};

export default Footer;
