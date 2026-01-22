import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { Fuel, Settings, Wallet, ChevronDown, ArrowDown, ChevronRight } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { useWallet } from '../contexts/WalletContext';
import CombinedSelector from './CombinedSelector';
import RouteSelector from './RouteSelector';
import { ethers } from 'ethers';

const SwapCard = () => {
    const { account, balance, connectWallet, signer } = useWallet();
    
    // State
    const [fromChain, setFromChain] = useState({ id: 1, name: 'Ethereum', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg' });
    const [toChain, setToChain] = useState({ id: 10, name: 'Optimism', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/optimism.svg' });
    const [sellToken, setSellToken] = useState({ symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg' });
    const [buyToken, setBuyToken] = useState({ symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' });
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [swapStatus, setSwapStatus] = useState('idle');

    // Modal States
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState('from'); // 'from' or 'to'
    const [isRoutesOpen, setIsRoutesOpen] = useState(false);

    // New Route Hook
    const { getRoutes, routes, activeRoute, setActiveRoute, isLoading, error } = useAggregator();

    // Handlers for Opening Combined Selector
    const openFromSelector = () => { setSelectorMode('from'); setIsSelectorOpen(true); };
    const openToSelector = () => { setSelectorMode('to'); setIsSelectorOpen(true); };

    const handleSelection = (chain, token) => {
        if (selectorMode === 'from') {
            setFromChain(chain);
            setSellToken(token);
        } else {
            setToChain(chain);
            setBuyToken(token);
        }
    };

    // --- Fetch Logic (Using getRoutes now) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            // Reset if empty
            if (!fromAmount || parseFloat(fromAmount) === 0) {
                setActiveRoute(null);
                setSwapStatus('idle');
                return;
            }
            
            if (!sellToken || !buyToken) return;

            try {
                // SAFETY: Default to 18 decimals if missing to prevent crashes
                const decimals = sellToken.decimals || 18;
                const amountWei = ethers.parseUnits(fromAmount, decimals).toString();
                
                getRoutes({
                    sellToken: sellToken.address,
                    buyToken: buyToken.address,
                    amount: amountWei,
                    userAddress: account,
                    fromChain: fromChain.id,
                    toChain: toChain.id
                });
            } catch (e) { 
                console.error("Input Parsing Error:", e);
                // Optionally set a local UI error state here if needed
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [fromAmount, sellToken, buyToken, fromChain, toChain, account]);

    // Update Output when Active Route Changes
    useEffect(() => {
        if (activeRoute && buyToken) {
            const decimals = activeRoute.outputDecimals || buyToken.decimals || 18;
            const formatted = ethers.formatUnits(activeRoute.output, decimals);
            setToAmount(parseFloat(formatted).toFixed(4));
        } else {
            setToAmount('');
        }
    }, [activeRoute, buyToken]);

    const executeSwap = async () => {
        if (!account) return connectWallet();
        if (!activeRoute) return;

        try {
            setSwapStatus('initiating');
            let activeSigner = signer;

            // 1. Switch Chain
            const currentChain = Number((await signer.provider.getNetwork()).chainId);
            if (currentChain !== fromChain.id) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + fromChain.id.toString(16) }],
                    });
                    const newProvider = new ethers.BrowserProvider(window.ethereum);
                    activeSigner = await newProvider.getSigner();
                } catch (e) {
                    alert(`Please switch network to ${fromChain.name}.`);
                    setSwapStatus('idle');
                    return;
                }
            }

            // 2. Approve Logic
            const step = activeRoute.steps[0];
            const approvalAddress = step.estimate?.approvalAddress; 
            const isNative = sellToken.address === '0x0000000000000000000000000000000000000000';

            if (approvalAddress && !isNative) {
                const tokenContract = new ethers.Contract(
                    sellToken.address,
                    ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"],
                    activeSigner
                );
                const decimals = sellToken.decimals || 18;
                const amountWei = ethers.parseUnits(fromAmount, decimals);
                const allowance = await tokenContract.allowance(account, approvalAddress);
                if (allowance < amountWei) {
                    setSwapStatus('approving');
                    const tx = await tokenContract.approve(approvalAddress, amountWei);
                    await tx.wait();
                }
            }

            // 3. Execute Transaction
            setSwapStatus('swapping');
            console.log("Executing Step (Full Object):", JSON.stringify(step, null, 2)); // DEBUG: Dump full step
            
            // LI.FI routes puts tx data in 'transactionRequest'
            // Fallback: Check step.estimate.transactionRequest (some providers nest it)
            const txData = step.transactionRequest || step.estimate?.transactionRequest;
            
            if (!txData) {
                const keys = Object.keys(step).join(', ');
                throw new Error(`Missing transaction request data. Available keys: [${keys}]`);
            }
            
            const { from, gas, gasLimit, chainId, nonce, ...cleanTx } = txData;
            const val = txData.value ? BigInt(txData.value) : 0n;
            
            // Safer Gas Limit (150% of estimate)
            let limit = 500000n;
            if (gasLimit) limit = (BigInt(gasLimit) * 150n) / 100n;

            console.log("Sending TX:", { ...cleanTx, value: val, gasLimit: limit });

            const tx = await activeSigner.sendTransaction({
                ...cleanTx,
                value: val,
                gasLimit: limit
            });
            
            await tx.wait();
            setSwapStatus('idle');
            // alert(`Success! Tx: ${tx.hash}`); // Replaced with UI success state if needed, or clear form
            setFromAmount('');
            setActiveRoute(null);
            setError(null); // Clear errors
        } catch (err) {
            setSwapStatus('idle');
            console.error("Swap Error:", err);
            
            // Extract meaningful error message
            let msg = err.message || "Transaction failed";
            if (err.info?.error?.message) msg = err.info.error.message;
            if (err.code === 'ACTION_REJECTED') msg = "User rejected transaction";
            if (msg.includes('insufficient funds')) msg = "Insufficient funds for gas";

            // Set UI Error instead of alert
            setError(msg);
        }
    };

    // Helper for Asset Rows
    const AssetRow = ({ label, chain, token, onClick, amount, isLoading }) => (
        <div 
            onClick={onClick}
            style={{
                background: '#131313', borderRadius: '16px', padding: '16px',
                border: '1px solid #1f1f1f', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'background 0.2s',
                minHeight: '80px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = '#131313'}
        >
            {/* Left Icon Stack */}
            <div style={{ position: 'relative', width: 44, height: 44 }}>
                <img src={token?.logoURI} style={{ width: 44, height: 44, borderRadius: '50%' }} alt="" onError={e => e.target.src = 'https://etherscan.io/images/main/empty-token.png'} />
                <img src={chain.logoURI} style={{ width: 18, height: 18, borderRadius: '50%', position: 'absolute', bottom: -2, right: -2, border: '2px solid #131313' }} alt="" />
            </div>

            {/* Middle Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{token?.symbol}</span>
                    <span style={{ fontSize: '0.9rem', color: '#555' }}>on {chain.name}</span>
                </div>
            </div>

            {/* Right Amount Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 {amount && (
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: isLoading ? '#888' : 'white' }}>
                            {isLoading ? '...' : amount}
                        </span>
                    </div>
                )}
                <ChevronDown size={20} color="#666" />
            </div>
        </div>
    );
    
    // Derived Button State
    const getButtonText = () => {
        if (swapStatus !== 'idle') return swapStatus.toUpperCase() + '...';
        if (isLoading) return 'Fetching Routes...';
        // if (error) return 'Errors Above'; // Don't block button text with error
        if (!activeRoute) return 'Enter Amount';
        return 'Review & Swap';
    };

    const isButtonDisabled = isLoading || swapStatus !== 'idle' || (!activeRoute && !error); 

    return (
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
            <GlowingCard spread={80} inactiveZone={0.01} glowColor="#ff7120">
                <div style={{ 
                    padding: '8px', background: '#0a0a0a', 
                    borderRadius: '24px', border: '1px solid #222',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Exchange</h2>
                            <Settings size={20} color="#666" style={{cursor:'pointer'}} />
                        </div>

                        {/* ROW 1: FROM */}
                        <AssetRow label="From" chain={fromChain} token={sellToken} onClick={openFromSelector} />

                        {/* Switcher */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '-14px 0', zIndex: 10 }}>
                             <div 
                                onClick={() => { const c = fromChain; setFromChain(toChain); setToChain(c); const t = sellToken; setSellToken(buyToken); setBuyToken(t); }}
                                style={{
                                    background: '#0a0a0a', border: '4px solid #0a0a0a', borderRadius: '12px',
                                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ background: '#1f1f1f', borderRadius: '8px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ArrowDown size={18} color="#888" />
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: TO */}
                        <AssetRow 
                            label="To" 
                            chain={toChain} 
                            token={buyToken} 
                            onClick={openToSelector} 
                        />

                        {/* ROUTE DETAILS (Clickable) */}
                        {activeRoute && (
                            <div 
                                onClick={() => setIsRoutesOpen(true)}
                                style={{ 
                                    margin: '8px 4px 4px 4px', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    fontSize: '0.85rem',
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#888', fontSize: '0.75rem' }}>Receive</span>
                                    <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                                        {toAmount} {buyToken?.symbol}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 113, 32, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255, 113, 32, 0.2)' }}>
                                    <div style={{display:'flex', alignItems: 'center', gap:'6px'}}>
                                        {activeRoute.logo && <img src={activeRoute.logo} style={{width: 16, height: 16, borderRadius: '4px'}} alt=""/>}
                                        <span style={{ color: '#ff7120', fontWeight: 600 }}>{activeRoute.provider}</span>
                                    </div>
                                    <div style={{ width: 1, height: 12, background: 'rgba(255, 113, 32, 0.3)' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff7120' }}>
                                        <Fuel size={12} />
                                        <span>${Number(activeRoute.gasCostUsd).toFixed(2)}</span>
                                    </div>
                                    <ChevronRight size={14} color="#ff7120" />
                                </div>
                            </div>
                        )}

                        {/* ROW 3: SEND INPUT */}
                        <div style={{
                            background: '#131313', borderRadius: '16px', padding: '16px',
                            border: '1px solid #1f1f1f', marginTop: '4px'
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>Send Amount</span>
                                {balance && <span style={{ fontSize: '0.8rem', color: '#666' }}>Max: {parseFloat(balance).toFixed(4)}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={sellToken?.logoURI} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" onError={e => e.target.src = 'https://etherscan.io/images/main/empty-token.png'} />
                                <input 
                                    type="number" 
                                    value={fromAmount}
                                    onChange={e => setFromAmount(e.target.value)}
                                    placeholder="0"
                                    style={{
                                        background: 'transparent', border: 'none', color: 'white',
                                        fontSize: '2rem', fontWeight: 600, outline: 'none', width: '100%',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
                                ~ ${(parseFloat(fromAmount || 0) * (parseFloat(sellToken?.priceUSD || 0))).toFixed(2)}
                            </div>
                        </div>

                        {/* Connect Wallet / Action */}
                        <div style={{ marginTop: '8px' }}>
                             {account ? (
                                <button 
                                    onClick={executeSwap}
                                    disabled={isButtonDisabled}
                                    style={{
                                        width: '100%',
                                        background: (isButtonDisabled) ? '#1f1f1f' : 'linear-gradient(90deg, #FF7120 0%, #FF4500 100%)',
                                        color: (isButtonDisabled) ? '#555' : 'white',
                                        border: 'none', borderRadius: '16px', padding: '16px',
                                        fontSize: '1.2rem', fontWeight: 700,
                                        cursor: (isButtonDisabled) ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {getButtonText()}
                                </button>
                             ) : (
                                 <button 
                                    onClick={connectWallet}
                                    style={{
                                        width: '100%', background: '#3f1a94', color: 'white', 
                                        border: 'none', borderRadius: '16px', padding: '16px',
                                        fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Wallet size={20} />
                                    Connect Wallet
                                </button>
                             )}
                        </div>
                    </div>
                </div>
            </GlowingCard>

            {/* COMBINED ASSET SELECTOR */}
            <CombinedSelector 
                isOpen={isSelectorOpen} 
                onClose={() => setIsSelectorOpen(false)}
                title={selectorMode === 'from' ? 'Exchange from' : 'Exchange to'}
                selectedChain={selectorMode === 'from' ? fromChain : toChain}
                selectedToken={selectorMode === 'from' ? sellToken : buyToken}
                onSelect={handleSelection}
            />

            {/* ROUTES SELECTOR */}
            <RouteSelector 
                isOpen={isRoutesOpen}
                onClose={() => setIsRoutesOpen(false)}
                routes={routes}
                selectedRoute={activeRoute}
                onSelect={setActiveRoute}
            />
            
            {/* Error Toast / Message Area - VISIBLE ERROR BOX */}
            {error && (
                <div style={{ 
                    marginTop: '16px', textAlign: 'center', padding: '12px', 
                    background: 'rgba(255, 50, 50, 0.15)', border: '1px solid rgba(255, 50, 50, 0.3)',
                    color: '#ff6666', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 500 
                }}>
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
};

export default SwapCard;
