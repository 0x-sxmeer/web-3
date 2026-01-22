import React from 'react';
import { Check, Fuel, Clock, Zap } from 'lucide-react';
import { ethers } from 'ethers';

const RouteSelector = ({ routes, selectedRoute, onSelect, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div 
                style={{ 
                    width: '450px', maxHeight: '80vh', 
                    background: '#121214', borderRadius: '24px', 
                    display: 'flex', flexDirection: 'column', 
                    border: '1px solid #333', overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Select Route</h3>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.9rem' }}>
                        Found {routes.length} paths for your swap
                    </p>
                </div>

                {/* List */}
                <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {routes.map((route, idx) => {
                        const isSelected = selectedRoute?.id === route.id;
                        const formattedOutput = parseFloat(ethers.formatUnits(route.output, route.outputDecimals || 18)).toFixed(4);
                        
                        return (
                            <div 
                                key={route.id}
                                onClick={() => { onSelect(route); onClose(); }}
                                style={{
                                    border: isSelected ? '1px solid #FF7120' : '1px solid #333',
                                    background: isSelected ? 'rgba(255, 113, 32, 0.1)' : '#1a1a1a',
                                    borderRadius: '16px', padding: '16px', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { if(!isSelected) e.currentTarget.style.borderColor = '#555'; }}
                                onMouseLeave={e => { if(!isSelected) e.currentTarget.style.borderColor = '#333'; }}
                            >
                                {/* Top Row: Provider & Amount */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {route.logo ? (
                                            <img src={route.logo} style={{ width: 32, height: 32, borderRadius: '8px' }} alt="" />
                                        ) : (
                                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#333', display:'flex', alignItems:'center', justifyContent:'center' }}><Zap size={16}/></div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{route.provider}</div>
                                            {idx === 0 && <span style={{ fontSize: '0.7rem', background: '#FF7120', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>BEST</span>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formattedOutput}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>${route.netValueUsd ? parseFloat(route.netValueUsd).toFixed(2) : '0.00'}</div>
                                    </div>
                                </div>

                                {/* Bottom Row: Gas & Time */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#888' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Fuel size={14} /> ${route.gasCostUsd ? parseFloat(route.gasCostUsd).toFixed(2) : '0.00'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> ~2 min
                                        </div>
                                    </div>
                                    {isSelected && <Check size={18} color="#FF7120" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RouteSelector;
