import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { ChevronDown, ArrowDown, Wallet, Loader2 } from 'lucide-react';

const SwapCard = () => {
    // Standalone Mock State
    const [account, setAccount] = useState(null);
    
    const [fromAmount, setFromAmount] = useState('1');
    const [toAmount, setToAmount] = useState('0.00');
    
    const [isSwapping, setIsSwapping] = useState(false);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    
    // Mock providers data
    const [providers, setProviders] = useState([
        { name: 'Uniswap V3', rate: '0.00', fee: '$4.50', best: true },
        { name: '1inch', rate: '0.00', fee: '$5.20', best: false },
        { name: 'CowSwap', rate: '0.00', fee: '$0.00', best: false },
    ]);

    // Mock Connect Wallet
    const connectWallet = () => {
        setAccount("0x123...abc");
    };

    // Simulate Quote Fetching
    useEffect(() => {
        const fetchQuote = () => {
            if (!fromAmount || parseFloat(fromAmount) === 0) {
                setToAmount("0.00");
                return;
            };

            setIsLoadingQuote(true);
            
            // Simulate network delay
            setTimeout(() => {
                const ethPrice = 2850; // Mock ETH price
                const val = parseFloat(fromAmount) * ethPrice;
                const rate = val.toFixed(2);
                
                setToAmount(rate);
                setProviders([
                    { name: 'Uniswap V3', rate: rate, fee: '~$4.50', best: false },
                    { name: '1inch', rate: (val * 1.002).toFixed(2), fee: '~$5.20', best: true },
                    { name: 'CowSwap', rate: (val * 0.998).toFixed(2), fee: '$0.00', best: false },
                ]);
                
                setIsLoadingQuote(false);
            }, 800);
        };

        const timeoutId = setTimeout(() => {
            fetchQuote();
        }, 600); 

        return () => clearTimeout(timeoutId);
    }, [fromAmount]);

    const handleSwap = () => {
        if (!account) {
            connectWallet();
            return;
        }

        setIsSwapping(true);
        // Simulate Transaction
        setTimeout(() => {
            alert("Swap Simulated Successfully!");
            setIsSwapping(false);
            setFromAmount("");
            setToAmount("0.00");
        }, 2000);
    };

    return (
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
            <GlowingCard 
                spread={80} 
                inactiveZone={0.01} 
                gradient="conic-gradient(from var(--start) at 50% 50%, transparent 0deg, #ff9f1c 20deg, #ff5e00 45deg, transparent 90deg)"
                glowColor="#ff7120"
            >
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Swap</h2>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff7120', boxShadow: '0 0 10px #ff7120' }}></span>
                            Best Route Active
                        </div>
                    </div>

                    {/* From Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You pay</span>
                            <span>Balance: {account ? '1.45' : '---'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                                type="number" 
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                placeholder="0"
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'white', 
                                    fontSize: '2rem', 
                                    fontFamily: 'var(--font-display)', 
                                    width: '60%',
                                    outline: 'none'
                                }} 
                            />
                            <button style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '2rem', 
                                padding: '0.5rem 1rem', 
                                color: 'white', 
                                cursor: 'pointer',
                                fontWeight: 600 
                            }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #627EEA 0%, #3D58B6 100%)' }}></div>
                                ETH <ChevronDown size={14} />
                            </button>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            ${(parseFloat(fromAmount || 0) * 2850).toLocaleString()} (Approx)
                        </div>
                    </div>

                    {/* Arrow Divider */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-1rem 0' }}>
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '0.8rem', padding: '0.5rem', cursor: 'pointer', zIndex: 10 }}>
                            <ArrowDown size={20} color="var(--text-muted)" />
                        </div>
                    </div>

                    {/* To Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You receive</span>
                            <span>Balance: 0.00</span>
                        </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {isLoadingQuote ? (
                                <div style={{ width: '60%', height: '38px', display: 'flex', alignItems: 'center' }}>
                                    <Loader2 className="animate-spin" color="#ff7120" />
                                </div>
                            ) : (
                                <input 
                                    type="number" 
                                    value={toAmount}
                                    readOnly
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        color: 'white', 
                                        fontSize: '2rem', 
                                        fontFamily: 'var(--font-display)', 
                                        width: '60%',
                                        outline: 'none'
                                    }} 
                                />
                            )}
                            <button style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '2rem', 
                                padding: '0.5rem 1rem', 
                                color: 'white', 
                                cursor: 'pointer',
                                fontWeight: 600 
                            }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2775CA' }}></div>
                                USDC <ChevronDown size={14} />
                            </button>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Price Impact <span style={{ color: '#ff3b30', fontSize: '0.75rem' }}>-0.05%</span>
                        </div>
                    </div>

                    {/* Aggregator Comparison */}
                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>BEST ROUTE</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {providers.map((p, i) => (
                                <div key={i} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '0.8rem', 
                                    borderRadius: '0.8rem', 
                                    background: p.best ? 'rgba(255, 113, 32, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: p.best ? '1px solid var(--accent-color)' : '1px solid transparent'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                                        {p.best && <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>BEST</span>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, color: p.best ? 'var(--accent-color)' : 'var(--text-color)' }}>{p.rate}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gas: {p.fee}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <button 
                            onClick={handleSwap}
                            disabled={isSwapping}
                            style={{
                            width: '100%',
                            background: isSwapping ? '#333' : 'var(--accent-color)',
                            border: 'none',
                            padding: '1.2rem',
                            borderRadius: '1rem',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            fontFamily: 'var(--font-display)',
                            cursor: isSwapping ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: isSwapping ? 0.7 : 1
                        }}>
                             {isSwapping ? 'CONFIRMING...' : (!account ? 'CONNECT WALLET' : 'SWAP NOW')}
                        </button>
                    </div>
                </div>
            </GlowingCard>
        </div>
    );
};

export default SwapCard;
