import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
// import { fetchOneInchTokens } from '../services/tokenService';
import { getTokensForNetwork } from '../services/tokenLists';

const TokenSelector = ({ selectedToken, onSelect, chainId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tokenList, setTokenList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Reload tokens when Chain ID changes (e.g., user switches from ETH to BSC)
    useEffect(() => {
        if (isOpen) {
            // Load tokens from static list based on chainId
            const defaults = getTokensForNetwork(chainId);
            setTokenList(defaults);
        }
    }, [isOpen, chainId]);

    const filteredTokens = useMemo(() => {
        if (!searchQuery) return tokenList;
        const lower = searchQuery.toLowerCase();
        return tokenList.filter(t => 
            t.symbol.toLowerCase().includes(lower) || 
            t.name.toLowerCase().includes(lower) ||
            t.address.toLowerCase() === lower
        );
    }, [tokenList, searchQuery]);

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '2rem', padding: '0.5rem 1rem', color: 'white', fontWeight: 600, cursor: 'pointer',
                    minWidth: '120px', justifyContent:'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedToken?.logo ? (
                        <img src={selectedToken.logo} style={{ width: 24, height: 24, borderRadius: '50%' }} onError={(e) => {e.target.style.display='none'}} />
                    ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#444' }}></div>
                    )}
                    {selectedToken?.symbol || "Select"} 
                </div>
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '320px',
                    background: '#1a1b1e', border: '1px solid #333', borderRadius: '1rem', padding: '1rem', zIndex: 100,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{position:'relative', marginBottom:'10px'}}>
                        <input 
                            placeholder="Search token..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white', outline:'none' }}
                        />
                        {isLoading && <Loader2 size={16} className="animate-spin" style={{position:'absolute', right:12, top:12, color:'#ff7120'}} />}
                    </div>
                    
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display:'flex', flexDirection:'column', gap:'4px' }}>
                        {filteredTokens.length === 0 && !isLoading && <div style={{textAlign:'center', padding:'20px', color:'#666'}}>No tokens found</div>}
                        
                         {filteredTokens.slice(0, 100).map(t => (
                            <div 
                                key={t.address}
                                onClick={() => { onSelect(t); setIsOpen(false); }}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', 
                                    cursor: 'pointer', borderRadius:'8px',
                                    background: selectedToken?.address === t.address ? 'rgba(255, 113, 32, 0.1)' : 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedToken?.address === t.address ? 'rgba(255, 113, 32, 0.1)' : 'transparent'}
                            >
                                <img src={t.logo} style={{ width: 28, height: 28, borderRadius: '50%' }} onError={(e) => {e.target.src='https://etherscan.io/images/main/empty-token.png'}} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{t.symbol}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{t.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {isOpen && <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />}
        </div>
    );
};

export default TokenSelector;
