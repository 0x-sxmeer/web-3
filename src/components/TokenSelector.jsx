import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { LiFiService } from '../services/lifiService';

const TokenSelector = ({ selectedToken, onSelect, chainId, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tokenList, setTokenList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch tokens when modal opens
    useEffect(() => {
        if (isOpen && chainId) {
            const loadTokens = async () => {
                setIsLoading(true);
                try {
                    const tokens = await LiFiService.getTokens(chainId);
                    setTokenList(tokens);
                } catch (e) {
                    console.error("Failed to load tokens", e);
                    setTokenList([]);
                } finally {
                    setIsLoading(false);
                }
            };
            loadTokens();
        }
    }, [isOpen, chainId]);

    // Efficient Filter
    const filteredTokens = useMemo(() => {
        if (!searchQuery) return tokenList.slice(0, 100); 
        const lower = searchQuery.toLowerCase();
        return tokenList.filter(t => 
            t.symbol.toLowerCase().includes(lower) || 
            t.name.toLowerCase().includes(lower) ||
            t.address.toLowerCase() === lower
        ).slice(0, 100);
    }, [tokenList, searchQuery]);

    const handleSelect = (t) => {
        onSelect(t);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <>
            {/* Contextual Trigger */}
            <div onClick={() => setIsOpen(true)} style={{ cursor: 'pointer', width: children ? '100%' : 'auto', display: children ? 'block' : 'inline-block' }}>
                {children ? children : (
                    <button 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            background: '#222', border: '1px solid #333', 
                            borderRadius: '24px', padding: '6px 12px 6px 8px', 
                            color: 'white', fontWeight: 600, cursor: 'pointer',
                            transition: '0.2s', minWidth: '120px', height: '40px',
                            justifyContent: 'space-between', width: '100%'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={selectedToken?.logoURI} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                            <span>{selectedToken?.symbol || 'Select'}</span>
                        </div>
                        <ChevronDown size={16} opacity={0.6} />
                    </button>
                )}
            </div>

            {/* Modal */}
            {isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setIsOpen(false)}>
                    
                    <div 
                        style={{ 
                            width: '420px', maxHeight: '80vh', 
                            background: '#121212', borderRadius: '24px', 
                            display: 'flex', flexDirection: 'column', 
                            border: '1px solid #333', 
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #1f1f1f' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Select a token</h3>
                                <div onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', padding: 4 }}><X size={24} color="#666" /></div>
                            </div>

                            <div style={{ 
                                background: '#1c1c1c', borderRadius: '16px', padding: '14px', 
                                display: 'flex', alignItems: 'center', gap: '12px',
                                border: '1px solid #333', transition: 'border-color 0.2s'
                            }}>
                                <Search size={20} color="#666" />
                                <input 
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or symbol" 
                                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', fontSize: '1.1rem', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {isLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                    <Loader2 className="animate-spin" size={32} color="#ff7120" />
                                </div>
                            ) : filteredTokens.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No tokens found</div>
                            ) : (
                                filteredTokens.map(token => (
                                    <div 
                                        key={token.address}
                                        onClick={() => handleSelect(token)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', borderRadius: '16px', cursor: 'pointer',
                                            transition: 'background 0.2s', margin: '2px 0'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#1f1f1f'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <img 
                                                src={token.logoURI} 
                                                style={{ width: 44, height: 44, borderRadius: '50%' }} 
                                                alt="" 
                                                onError={e => e.target.src = 'https://etherscan.io/images/main/empty-token.png'}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#eee' }}>{token.symbol}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#666' }}>{token.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </>
    );
};

export default TokenSelector;
