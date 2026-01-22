import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingBubbles from '../components/FloatingBubbles';
import SwapCard from '../components/SwapCard';
import { Reveal } from '../components/Animations';

const SwapPage = () => {
    return (
        <div style={{ position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <FloatingBubbles />
            
            {/* Content Layer */}
            <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                
                <main style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '120px 20px',
                    minHeight: 'calc(100vh - 80px - 200px)' // Account for Navbar/Footer approximation
                }}>
                   <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Reveal>
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, marginBottom: '1rem' }}>
                                    SWAP AGGREGATOR
                                </h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                                    Get the best rates from Uniswap, 1inch, and CowSwap. <br/> Zero extra fees on native token swaps.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={0.2} width="100%">
                            <SwapCard />
                        </Reveal>
                   </div>
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default SwapPage;
