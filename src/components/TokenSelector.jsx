import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { fetchOneInchTokens } from '../services/tokenService'; // Import the new service
import { getTokensForNetwork } from '../services/tokenLists'; // Keep as fallback

const TokenSelector = ({ selectedToken, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tokenList, setTokenList] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const { chainId } = useWallet();

    // 1. Fetch Tokens when Chain Changes or Menu Opens
    useEffect(() => {
        if (isOpen) {
            const loadTokens = async () => {
                const currentChain = Number(chainId) || 1;
                
                // Start with default/hardcoded tokens immediately
                const defaults = getTokensForNetwork(currentChain);
                setTokenList(defaults);

                setIsLoadingList(true);
                // Fetch full list in background
                const fullList = await fetchOneInchTokens(currentChain);
                if (fullList.length > 0) {
                    setTokenList(fullList);
                }
                setIsLoadingList(false);
            };
            loadTokens();
        }
    }, [isOpen, chainId]);

    // 2. Filter Logic (Memoized for performance)
    const filteredTokens = useMemo(() => {
        if (!searchQuery) return tokenList;

        const lowerQuery = searchQuery.toLowerCase();
        return tokenList.filter(t => 
            t.symbol.toLowerCase().includes(lowerQuery) || 
            t.name.toLowerCase().includes(lowerQuery) ||
            t.address.toLowerCase() === lowerQuery // Exact match for address
        );
    }, [tokenList, searchQuery]);

    const selectToken = (t) => {
        onSelect(t);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '2rem', padding: '0.5rem 1rem', color: 'white', fontWeight: 600, cursor: 'pointer',
                    minWidth: '120px', justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedToken.logo ? (
                        <img src={selectedToken.logo} alt={selectedToken.symbol} 
                             style={{ width: 24, height: 24, borderRadius: '50%' }} 
                             onError={(e) => {e.target.style.display='none'}} // Hide broken images
                        />
                    ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #627EEA 0%, #3D58B6 100%)' }}></div>
                    )}
                    {selectedToken.symbol} 
                </div>
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '350px',
                    background: '#1a1b1e', border: '1px solid #333', borderRadius: '1rem',
                    padding: '1rem', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#666' }} />
                        <input 
                            type="text" 
                            placeholder="Search name or paste address..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', background: '#111', border: '1px solid #333',
                                borderRadius: '0.5rem', padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                                color: 'white', fontSize: '0.9rem', outline: 'none'
                            }}
                        />
                        {isLoadingList && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 12, top: 12, color: '#FF7120' }} />}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        
                        {filteredTokens.length === 0 && !isLoadingList && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                                No tokens found
                            </div>
                        )}

                        {/* Performance Optimization: Only render top 100 if searching to avoid lag */}
                        {filteredTokens.slice(0, 100).map((t) => (
                            <div 
                                key={t.address}
                                onClick={() => selectToken(t)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '0.6rem', borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    background: selectedToken.address === t.address ? 'rgba(255, 113, 32, 0.1)' : 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedToken.address === t.address ? 'rgba(255, 113, 32, 0.1)' : 'transparent'}
                            >
                                <img 
                                    src={t.logo || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'} 
                                    alt={t.symbol} 
                                    style={{ width: 28, height: 28, borderRadius: '50%' }}
                                    onError={(e) => {e.target.src = 'https://etherscan.io/images/main/empty-token.png'}} 
                                />
                                <div style={{flex: 1}}>
                                    <div style={{ fontWeight: 600, display:'flex', justifyContent:'space-between' }}>
                                        <span>{t.symbol}</span>
                                        {/* Optional: Show balance here later if needed */}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{t.name}</div>
                                </div>
                                {selectedToken.address === t.address && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-color)' }}></div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Backdrop to close */}
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                />
            )}
        </div>
    );
};

export default TokenSelector;
