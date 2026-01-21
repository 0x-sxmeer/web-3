import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { LiFiService } from '../services/lifiService';

const ChainSelector = ({ selectedChain, onSelect, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [chains, setChains] = useState([]);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    // Fetch Chains on Mount
    useEffect(() => {
        const load = async () => {
            const list = await LiFiService.getChains();
            setChains(list);
        };
        load();
    }, []);

    // Filter Search
    const filteredChains = useMemo(() => {
        return chains.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [chains, search]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (chain) => {
        onSelect(chain);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                {/* Custom Trigger support */}
                {children ? children : (
                    <button 
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#222', border: '1px solid #333',
                            borderRadius: '12px', padding: '6px 12px',
                            color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                            minWidth: '140px', height: '40px', width: '100%'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
                    >
                        {selectedChain ? (
                            <>
                                <img src={selectedChain.logoURI} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedChain.name}</span>
                            </>
                        ) : (
                            <span>Select Chain</span>
                        )}
                        <ChevronDown size={16} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '120%', right: 0, width: '280px', // Right aligned for better fit in cards
                    background: '#121214', border: '1px solid #333', borderRadius: '16px',
                    padding: '12px', zIndex: 1000, // High z-index
                    boxShadow: '0 10px 40px rgba(0,0,0,0.95)',
                }}>
                    {/* Search */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                        <Search size={18} color="#888" />
                        <input 
                            onClick={e => e.stopPropagation()}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search networks..."
                            style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '10px', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                            autoFocus
                        />
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filteredChains.map(chain => (
                            <div 
                                key={chain.id}
                                onClick={(e) => { e.stopPropagation(); handleSelect(chain); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                    background: selectedChain?.id === chain.id ? 'rgba(255, 113, 32, 0.15)' : 'transparent',
                                    border: selectedChain?.id === chain.id ? '1px solid rgba(255, 113, 32, 0.3)' : '1px solid transparent'
                                }}
                                onMouseEnter={e => { if (selectedChain?.id !== chain.id) e.currentTarget.style.background = '#222'; }}
                                onMouseLeave={e => { if (selectedChain?.id !== chain.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <img src={chain.logoURI} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                <span style={{ fontSize: '1rem', fontWeight: 500 }}>{chain.name}</span>
                                {selectedChain?.id === chain.id && <Check size={16} color="#FF7120" style={{ marginLeft: 'auto' }} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChainSelector;
