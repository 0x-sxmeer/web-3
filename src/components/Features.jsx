import React, { useRef } from 'react';
import { Reveal } from './Animations';
import { GlowingCard } from './GlowingCard';

const Features = () => {
    const videoRef = useRef(null);

  return (
    <section style={{ padding: '8rem 40px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem', flexWrap: 'wrap', gap: '2rem' }}>
        <Reveal>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--text-color)', fontWeight: 700, letterSpacing: '-0.03em' }}>
                SUPERCHARGING<br/>YOUR TRADES
            </h2>
        </Reveal>
        
        <Reveal delay={0.2}>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '1.2rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>WHY NEBULA?</div>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {['Best Rates', 'Low Fees', 'Fast', 'Secure'].map(tag => (
                        <span key={tag} style={{ 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            padding: '0.6rem 1.4rem', 
                            borderRadius: '0', 
                            fontSize: '0.9rem',
                            background: 'transparent',
                            fontWeight: 500,
                            color: 'var(--text-color)'
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </Reveal>
      </div>

      <div className="features-grid" style={{ 
          display: 'grid', 
          gap: '2.5rem', 
          alignItems: 'stretch'
      }}>
        {/* Left Card */}
        <Reveal delay={0.3} width="100%">
            <GlowingCard>
                <div style={{ 
                    padding: '3rem', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '480px',
                    height: '100%'
                }}>
                    <div>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontWeight: 600 }}>BEST RATES &<br/>ROUTING</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1rem' }}>
                            We aggregate liquidity from top DEXs to ensure you get the best possible price for every trade.
                        </p>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '3rem' }}>
                        {['Zero Slippage', 'MEV Protection', 'Gas Optimization', 'Deep Liquidity'].map(item => (
                            <li key={item} style={{ padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 500 }}>
                                {item} <span style={{ color: 'var(--accent-color)' }}>+</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </GlowingCard>
        </Reveal>

        {/* Center Visual */}
        <Reveal delay={0.4} width="100%">
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                height: '100%',
                overflow: 'visible'
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <video 
                        ref={videoRef}
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        style={{ 
                            width: '120%', 
                            height: '100%', 
                            maxHeight: '600px',
                            objectFit: 'contain', 
                            pointerEvents: 'none',
                            /* Slight brightness boost for dark mode if needed */
                            filter: 'brightness(1.1)' 
                        }}
                    >
                        <source src="https://chaingpt-web.s3.us-east-2.amazonaws.com/assets/video/Labs/LABS_hero_CHROME_VP9.webm" type="video/webm" />
                        <source src="https://chaingpt-web.s3.us-east-2.amazonaws.com/assets/video/Labs/LABS_hero_SAFARI_HEVC.mp4" type="video/mp4; codecs=hvc1" />
                    </video>
                </div>
            </div>
        </Reveal>

        {/* Right Card */}
        <Reveal delay={0.5} width="100%">
            <GlowingCard>
                <div style={{ 
                    padding: '3rem', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '480px',
                    height: '100%'
                }}>
                    <div>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontWeight: 600 }}>MULTI-CHAIN<br/>FREEDOM</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1rem' }}>
                            Swap tokens seamlessly across Ethereum, BSC, Polygon, Avalanche, and more with a single click.
                        </p>
                    </div>
                     <ul style={{ listStyle: 'none', padding: 0, marginTop: '3rem' }}>
                        {['Cross-Chain', 'Bridge', 'Native Swap', '10+ Chains'].map(item => (
                            <li key={item} style={{ padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 500 }}>
                                {item} <span style={{ color: 'var(--accent-color)' }}>+</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </GlowingCard>
        </Reveal>
      </div>
      <style>{`
          .features-grid {
              grid-template-columns: minmax(300px, 1fr) 30% minmax(300px, 1fr);
          }
          @media (max-width: 1024px) {
              .features-grid {
                  grid-template-columns: 1fr;
              }
          }
      `}</style>
    </section>
  );
};

export default Features;
