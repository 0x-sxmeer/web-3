import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Loader2, Check, ChevronRight } from 'lucide-react';
import { LiFiService } from '../services/lifiService';

const CombinedSelector = ({ isOpen, onClose, title, selectedChain, selectedToken, onSelect }) => {
    const [chains, setChains] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingTokens, setIsLoadingTokens] = useState(false);
    
    // Internal state for the modal interaction
    const [activeChain, setActiveChain] = useState(selectedChain);

    // 1. Fetch Chains on mount
    useEffect(() => {
        if (isOpen) {
            const loadChains = async () => {
                const list = await LiFiService.getChains();
                setChains(list);
            };
            loadChains();
        }
    }, [isOpen]);

    // 2. Sync activeChain with prop when modal opens
    useEffect(() => {
        if (isOpen && selectedChain) {
            setActiveChain(selectedChain);
        }
    }, [isOpen, selectedChain]);

    // 3. Fetch Tokens when activeChain changes
    useEffect(() => {
        if (isOpen && activeChain) {
            const loadTokens = async () => {
                setIsLoadingTokens(true);
                const list = await LiFiService.getTokens(activeChain.id);
                setTokens(list);
                setIsLoadingTokens(false);
            };
            loadTokens();
        }
    }, [isOpen, activeChain]);

    // 4. Filter tokens
    const filteredTokens = useMemo(() => {
        if (!searchQuery) return tokens.slice(0, 100);
        const lower = searchQuery.toLowerCase();
        return tokens.filter(t => 
            t.symbol.toLowerCase().includes(lower) || 
            t.name.toLowerCase().includes(lower) ||
            t.address.toLowerCase() === lower
        ).slice(0, 100);
    }, [tokens, searchQuery]);

    // Handlers
    const handleChainClick = (chain) => {
        setActiveChain(chain);
        setTokens([]); // Clear previous tokens immediately to prevent mismatch clicks
        setSearchQuery(''); // Reset search when switching chains
    };

    const handleTokenClick = (token) => {
        onSelect(activeChain, token);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            
            <div 
                style={{ 
                    width: '800px', height: '600px', 
                    background: '#121212', borderRadius: '24px', 
                    display: 'flex', flexDirection: 'column', 
                    border: '1px solid #333', overflow: 'hidden',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
                    animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{title || 'Select Token'}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    
                    {/* LEFT COLUMN: TOKENS (60%) */}
                    <div style={{ flex: '6', display: 'flex', flexDirection: 'column', borderRight: '1px solid #222' }}>
                        {/* Search Bar */}
                        <div style={{ padding: '16px' }}>
                            <div style={{ 
                                background: '#1c1c1c', borderRadius: '12px', padding: '12px', 
                                display: 'flex', alignItems: 'center', gap: '10px',
                                border: '1px solid #333'
                            }}>
                                <Search size={18} color="#666" />
                                <input 
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={`Search ${activeChain?.name || ''} tokens...`}
                                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Token List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
                            {isLoadingTokens ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                    <Loader2 className="animate-spin" size={32} color="#ff7120" />
                                </div>
                            ) : filteredTokens.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No tokens found</div>
                            ) : (
                                filteredTokens.map(token => (
                                    <div 
                                        key={token.address}
                                        onClick={() => handleTokenClick(token)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                                            transition: 'background 0.2s', margin: '4px 0'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#1f1f1f'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img 
                                                src={token.logoURI} 
                                                style={{ width: 36, height: 36, borderRadius: '50%' }} 
                                                alt="" 
                                                onError={e => e.target.src = 'https://etherscan.io/images/main/empty-token.png'}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, fontSize: '1rem', color: '#eee' }}>{token.symbol}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{token.name}</span>
                                            </div>
                                        </div>
                                        {token.priceUSD && (
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 500, color: '#eee' }}>${parseFloat(token.priceUSD).toFixed(2)}</div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: NETWORKS (40%) */}
                    <div style={{ flex: '4', display: 'flex', flexDirection: 'column', background: '#161616' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #222', color: '#888', fontWeight: 600, fontSize: '0.9rem' }}>
                            Select Network
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                            {chains.map(chain => (
                                <div 
                                    key={chain.id}
                                    onClick={() => handleChainClick(chain)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                        background: activeChain?.id === chain.id ? 'rgba(255, 113, 32, 0.15)' : 'transparent',
                                        border: activeChain?.id === chain.id ? '1px solid rgba(255, 113, 32, 0.3)' : '1px solid transparent',
                                        transition: 'all 0.2s', marginBottom: '4px'
                                    }}
                                    onMouseEnter={e => { if (activeChain?.id !== chain.id) e.currentTarget.style.background = '#222'; }}
                                    onMouseLeave={e => { if (activeChain?.id !== chain.id) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <img src={chain.logoURI} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: activeChain?.id === chain.id ? '#ff7120' : '#ccc', flex: 1 }}>{chain.name}</span>
                                    {activeChain?.id === chain.id && <ChevronRight size={16} color="#ff7120" />}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CombinedSelector;
