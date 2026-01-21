import React, { useState } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';

// Minimal ERC20 ABI for valid Metadata
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const TokenSelector = ({ selectedToken, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [foundToken, setFoundToken] = useState(null);

    // Default Tokens
    const defaultTokens = [
        { symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
        { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
        { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
        { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png' },
        { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', decimals: 18, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png' }
    ];

    const handleSearch = async (query) => {
        setSearchQuery(query);
        setError(null);
        setFoundToken(null);

        // Validation: 0x + 40 hex chars = 42 chars total
        if (query.startsWith('0x') && query.length === 42) {
            setLoading(true);
            try {
                // Connect to provider (using window.ethereum if available, else standard RPC)
                // For read-only, we can try to use window.ethereum even if not connected, or a default provider
                // Using a fallback public RPC for stability if window.ethereum isn't ready
                let provider;
                if (window.ethereum) {
                    provider = new ethers.BrowserProvider(window.ethereum);
                } else {
                    // Fallback to a public node if needed, but for now let's rely on browser wallet or throw
                    // throw new Error("No wallet provider found");
                    // Actually, let's just use cloudfare for public read if no wallet
                    provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
                }

                const contract = new ethers.Contract(query, ERC20_ABI, provider);
                
                // Fetch metadata in parallel
                const [symbol, decimals] = await Promise.all([
                    contract.symbol(),
                    contract.decimals()
                ]);

                setFoundToken({
                    address: query,
                    symbol: symbol,
                    decimals: Number(decimals),
                    logo: null // No logo for custom tokens usually
                });

            } catch (err) {
                console.error("Token fetch error:", err);
                setError("Invalid contract or not an ERC20");
            } finally {
                setLoading(false);
            }
        }
    };

    const selectToken = (t) => {
        onSelect(t);
        setIsOpen(false);
        setSearchQuery('');
        setFoundToken(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '2rem', padding: '0.5rem 1rem', color: 'white', fontWeight: 600, cursor: 'pointer',
                    minWidth: '100px', justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedToken.logo ? (
                        <img src={selectedToken.logo} alt={selectedToken.symbol} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #627EEA 0%, #3D58B6 100%)' }}></div>
                    )}
                    {selectedToken.symbol} 
                </div>
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '300px',
                    background: '#1a1b1e', border: '1px solid #333', borderRadius: '1rem',
                    padding: '1rem', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#666' }} />
                        <input 
                            type="text" 
                            placeholder="Search or paste address (0x...)" 
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                width: '100%', background: '#111', border: '1px solid #333',
                                borderRadius: '0.5rem', padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                                color: 'white', fontSize: '0.9rem', outline: 'none'
                            }}
                        />
                        {loading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 12, top: 12, color: '#666' }} />}
                    </div>

                    {/* Error Msg */}
                    {error && <div style={{ color: '#f87171', fontSize: '0.8rem', padding: '0.5rem' }}>{error}</div>}

                    {/* List */}
                    <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        
                        {/* Found Token (High Priority) */}
                        {foundToken && (
                            <div 
                                onClick={() => selectToken(foundToken)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '0.6rem', borderRadius: '0.5rem',
                                    cursor: 'pointer', background: 'rgba(255, 113, 32, 0.1)'
                                }}
                            >
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>?</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{foundToken.symbol}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>Imported Address</div>
                                </div>
                            </div>
                        )}

                        {/* Default Tokens (Filtered) */}
                        {!foundToken && defaultTokens
                            .filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.address.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((t) => (
                            <div 
                                key={t.address}
                                onClick={() => selectToken(t)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '0.6rem', borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    background: selectedToken.address === t.address ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedToken.address === t.address ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}
                            >
                                <img src={t.logo} alt={t.symbol} style={{ width: 26, height: 26, borderRadius: '50%' }} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{t.symbol}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{t.symbol}</div>
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
