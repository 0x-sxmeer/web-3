import React from 'react';
import Marquee from 'react-fast-marquee';
import { Reveal, ScrambleText } from './Animations';
import { RGBShader } from './RGBShader';

const Hero = () => {
    const partners = [
        { name: 'Chainlink', url: 'https://cdn.prod.website-files.com/6649e26c9fdc8739cefdc48e/6649fe6e46e4c0897ba16dad_chainlink.svg' },
        { name: 'Tron', url: 'https://cdn.prod.website-files.com/6649e26c9fdc8739cefdc48e/6649fe829a33b78ff150781b_tron.svg' },
        { name: 'BNB', url: 'https://cdn.prod.website-files.com/6649e26c9fdc8739cefdc48e/6649ff0cc51fe67c684cfad9_bnb.svg' },
        { name: 'OKX', url: 'https://cdn.prod.website-files.com/6649e26c9fdc8739cefdc48e/6649ff13b42127ac50ff5b0c_okx.svg' },
        { name: 'Solana', url: 'https://cdn.prod.website-files.com/6649e26c9fdc8739cefdc48e/667a8ba654f957df625d0d4a_solana.svg' },
        { name: 'CoinMarketCap', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/CoinMarketCap_logo.svg/2560px-CoinMarketCap_logo.svg.png' }, 
        { name: 'Castrum', url: 'https://cdn.prod.website-files.com/6649e26c9fdc8739cefdc48e/6649ff13b42127ac50ff5b0c_okx.svg' }
    ];

    return (
        <section style={{ 
            padding: '160px 0 0', 
            textAlign: 'center', 
            position: 'relative', 
            /* Ensure containment for absolute children */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '80vh' /* Ensure enough height for the effect */
        }}>
            {/* RGB Shader Background constrained to Hero */}
            <div style={{
                position: 'absolute',
                top: '-20%', /* Slight offset to start wave earlier */
                left: 0,
                width: '100%',
                height: '120%', /* Allow it to flow slightly */
                zIndex: -1,
                overflow: 'hidden',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', /* Fade out at bottom */
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
            }}>
                <RGBShader />
            </div>

            <Reveal width="100%">
                <h1 style={{ 
                    fontSize: 'clamp(3.5rem, 12vw, 9.5rem)', 
                    lineHeight: 0.9, 
                    marginBottom: '2.5rem', 
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.04em',
                    color: 'var(--text-color)',
                    marginLeft: '-0.05em',
                    fontWeight: 700
                }}>
                    MULTI-CHAIN<br/>SWAPPING
                </h1>
            </Reveal>

            <Reveal width="100%" delay={0.1}>
                <p style={{ 
                    maxWidth: '580px', 
                    margin: '0 auto 3.5rem', 
                    fontSize: '1.2rem', 
                    color: 'var(--text-muted)', 
                    lineHeight: 1.6,
                    fontWeight: 400,
                    letterSpacing: '-0.01em'
                }}>
                    The ultimate aggregator for seamless, low-fee token swaps across all major chains.
                </p>
            </Reveal>
            
            <Reveal width="100%" delay={0.2}>
                <button style={{
                    background: 'transparent',
                    border: '1px solid var(--text-color)',
                    padding: '1.1rem 3rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    marginBottom: '7rem',
                    position: 'relative',
                    color: 'var(--text-color)',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(0.96)';
                    e.currentTarget.style.background = 'var(--text-color)';
                    e.currentTarget.style.color = '#000';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-color)';
                }}
                >
                    <ScrambleText text="Start Swapping" />
                </button>
            </Reveal>

            <div style={{ 
                width: '100%',
                borderTop: '1px solid var(--glass-border)', 
                borderBottom: '1px solid var(--glass-border)', 
                padding: '2rem 0', 
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2 /* Keep marquee above shader if it overlaps */
            }}>
                <Marquee gradient={false} speed={35} pauseOnHover={true}>
                     {partners.concat(partners).concat(partners).map((p, i) => (
                         <div key={i} style={{ margin: '0 4rem', display: 'flex', alignItems: 'center' }}>
                             <img src={p.url} alt={p.name} style={{ 
                                 height: '32px', 
                                 opacity: 0.8, 
                                 filter: 'invert(1) grayscale(100%) brightness(1)' 
                            }} />
                         </div>
                     ))}
                </Marquee>
            </div>
        </section>
    )
}
export default Hero;
