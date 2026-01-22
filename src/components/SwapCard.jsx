import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { Fuel, Settings, Wallet, ChevronDown, ArrowDown, ChevronRight, ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { useWallet } from '../contexts/WalletContext';
import CombinedSelector from './CombinedSelector';
import RouteSelector from './RouteSelector';
import { ethers } from 'ethers';
import { CHAIN_PARAMS } from '../constants/chains';
import { LiFiService } from '../services/lifiService';

const SwapCard = () => {
    const { account, balance, connectWallet, signer } = useWallet();
    
    // Core Swap State
    const [fromChain, setFromChain] = useState({ id: 1, name: 'Ethereum', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg' });
    const [toChain, setToChain] = useState({ id: 10, name: 'Optimism', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/optimism.svg' });
    const [sellToken, setSellToken] = useState({ symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg' });
    const [buyToken, setBuyToken] = useState({ symbol: 'USDC', name: 'USD Coin', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', decimals: 6, logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' });
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [swapStatus, setSwapStatus] = useState('idle');

    // Modal States
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState('from'); // 'from' or 'to'
    const [isRoutesOpen, setIsRoutesOpen] = useState(false);
    const [uiError, setUiError] = useState(null);

    // Settings / Flip State
    const [isFlipped, setIsFlipped] = useState(false);
    const [settingsView, setSettingsView] = useState('main'); // 'main', 'bridges', 'exchanges'
    
    // Tools Data (Available from API)
    const [availableBridges, setAvailableBridges] = useState([]);
    const [availableExchanges, setAvailableExchanges] = useState([]);
    const [isLoadingTools, setIsLoadingTools] = useState(false);

    // Preferences State
    const [slippage, setSlippage] = useState('Auto');
    const [routePriority, setRoutePriority] = useState('Best Return');
    const [gasPrice, setGasPrice] = useState('Normal');
    const [enabledBridges, setEnabledBridges] = useState([]);
    const [enabledExchanges, setEnabledExchanges] = useState([]);

    // New Route Hook
    const { getRoutes, routes, activeRoute, setActiveRoute, isLoading, error } = useAggregator();

    // Handlers
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

    // --- Fetch Tools on Mount ---
    useEffect(() => {
        const loadTools = async () => {
            setIsLoadingTools(true);
            const tools = await LiFiService.getTools();
            
            // Extract keys for default selected state
            const bridges = tools.bridges.map(b => b.key);
            const exchanges = tools.exchanges.map(e => e.key);

            setAvailableBridges(tools.bridges);
            setAvailableExchanges(tools.exchanges);
            
            // Default: Enable All
            setEnabledBridges(bridges);
            setEnabledExchanges(exchanges);
            setIsLoadingTools(false);
        };
        loadTools();
    }, []);

    const toggleItem = (itemKey, list, setList) => {
        if (list.includes(itemKey)) {
            setList(list.filter(i => i !== itemKey));
        } else {
            setList([...list, itemKey]);
        }
    };

    // --- Fetch Logic ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!fromAmount || parseFloat(fromAmount) === 0) {
                setActiveRoute(null);
                setSwapStatus('idle');
                return;
            }
            if (!sellToken || !buyToken) return;

            try {
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
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [fromAmount, sellToken, buyToken, fromChain, toChain, account]);

    // Update Output
    useEffect(() => {
        if (activeRoute && buyToken) {
            const decimals = activeRoute.outputDecimals || buyToken.decimals || 18;
            const formatted = ethers.formatUnits(activeRoute.output, decimals);
            setToAmount(parseFloat(formatted).toFixed(4));
        } else {
            setToAmount('');
        }
    }, [activeRoute, buyToken]);

    // Network Switching
    const handleSwitchNetwork = async () => {
        console.log("handleSwitchNetwork CLICKED");
        const chainIdHex = '0x' + fromChain.id.toString(16);
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
        } catch (switchError) {
            if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
                const params = CHAIN_PARAMS[fromChain.id];
                if (!params) {
                    alert('Chain parameters not found. Please add manually.');
                    return;
                }
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [params],
                    });
                } catch (addError) {
                    console.error("Failed to add chain:", addError);
                    alert("Failed to add network to wallet.");
                }
            } else {
                console.error("Failed to switch network:", switchError);
                alert("Failed to switch network. Please switch manually.");
            }
        }
    };

    // Execute Swap
    const executeSwap = async () => {
        console.log("executeSwap CLICKED"); 
        
        if (!account) return connectWallet();
        if (!activeRoute) {
            console.warn("No active route");
            return;
        }

        try {
            setSwapStatus('initiating');
            let activeSigner = signer;
            
            if (!activeSigner) {
                 const provider = new ethers.BrowserProvider(window.ethereum);
                 activeSigner = await provider.getSigner();
                 if (!activeSigner) throw new Error("No signer available");
            }

            // 1. Switch Chain Check
            const currentChain = Number((await activeSigner.provider.getNetwork()).chainId);
            console.log(`[Swap] Current Chain: ${currentChain}, Required: ${fromChain.id}`);
            
            if (currentChain !== fromChain.id) {
                console.log("[Swap] Switching network...");
                await handleSwitchNetwork();
                const updatedChain = Number((await activeSigner.provider.getNetwork()).chainId);
                if (updatedChain !== fromChain.id) {
                    throw new Error("Network switch failed or was rejected");
                }
                const newProvider = new ethers.BrowserProvider(window.ethereum);
                activeSigner = await newProvider.getSigner();
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
            console.log("Executing Step (Keys):", Object.keys(step));
            
            // Fix: Check fallback location for tx data
            let txData = step.transactionRequest || step.estimate?.transactionRequest;
            
             // JIT Fallback: If missing, fetch from API
             if (!txData) {
                console.log("Tx Data missing, fetching fresh transaction...");
                try {
                    const hydratedStep = await LiFiService.getStepTransaction(step);
                    txData = hydratedStep.transactionRequest || hydratedStep.estimate?.transactionRequest;
                    console.log("Fetched Fresh Tx Data:", txData);
                } catch (fetchErr) {
                    console.error("Failed to fetch fresh transaction:", fetchErr);
                }
            }

            if (!txData) {
                const keys = Object.keys(step).join(', ');
                console.error("Step Data Dump:", JSON.stringify(step, null, 2));
                throw new Error(`Missing transaction request data. Available keys: [${keys}]`);
            }
            
            const { from, gas, gasLimit, chainId, nonce, ...cleanTx } = txData;
            const val = txData.value ? BigInt(txData.value) : 0n;
            
            let limit = 500000n; // Default fallback
            if (txData.gasLimit) {
                limit = (BigInt(txData.gasLimit) * 125n) / 100n;
            }

            console.log("Sending TX:", { ...cleanTx, value: val, gasLimit: limit });

            const tx = await activeSigner.sendTransaction({
                ...cleanTx,
                value: val,
                gasLimit: limit
            });
            
            await tx.wait();
            setSwapStatus('idle');
            setFromAmount('');
            setActiveRoute(null);
            setUiError(null); 
        } catch (err) {
            setSwapStatus('idle');
            console.error("Swap Error Full:", err);
            let msg = err.message || "Transaction failed";
            if (err.info?.error?.message) msg = err.info.error.message;
            if (err.code === 'ACTION_REJECTED') msg = "User rejected transaction";
            if (msg.includes('insufficient funds')) msg = "Insufficient funds for gas";
            if (msg.includes('Network switch failed')) msg = "Network switch required to swap";

            console.error("Swap Error Logic:", msg);
            setUiError(msg);
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
            <div style={{ position: 'relative', width: 44, height: 44 }}>
                <img src={token?.logoURI} style={{ width: 44, height: 44, borderRadius: '50%' }} alt="" onError={e => e.target.src = 'https://etherscan.io/images/main/empty-token.png'} />
                <img src={chain.logoURI} style={{ width: 18, height: 18, borderRadius: '50%', position: 'absolute', bottom: -2, right: -2, border: '2px solid #131313' }} alt="" />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{token?.symbol}</span>
                    <span style={{ fontSize: '0.9rem', color: '#555' }}>on {chain.name}</span>
                </div>
            </div>
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
    const activeChainId = useWallet().chainId;
    const isWrongNetwork = account && activeChainId && (Number(activeChainId) !== fromChain.id);
    const isButtonDisabled = isLoading || swapStatus !== 'idle' || (!activeRoute && !uiError && !error && !isWrongNetwork); 

    const getButtonText = () => {
        if (swapStatus !== 'idle') return swapStatus.toUpperCase() + '...';
        if (isLoading) return 'Fetching Routes...';
        if (uiError || error) return 'Try Again';
        if (!activeRoute) return 'Enter Amount';
        return 'Review & Swap';
    };

    // Sub-Components for Settings
    const SettingItem = ({ icon: Icon, label, value, onClick }) => (
        <div 
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', background: 'white', 
                borderRadius: '12px', marginBottom: '8px',
                cursor: onClick ? 'pointer' : 'default',
                color: 'black' 
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <Icon size={20} color="#000" />
                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{label}</span>
            </div>
            <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>{value}</span>
        </div>
    );

    const ToggleList = ({ title, items, selectedKeys, onToggle, onBack }) => (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
                <div onClick={onBack} style={{ cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} color="white" /></div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{title}</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {isLoadingTools ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 className="animate-spin" color="white" size={24} /></div>
                ) : (
                    items.map(item => {
                        const isSelected = selectedKeys.includes(item.key);
                        return (
                            <div 
                                key={item.key} 
                                onClick={() => onToggle(item.key)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px', borderRadius: '8px', marginBottom: '4px',
                                    cursor: 'pointer', background: isSelected ? 'rgba(255, 113, 32, 0.1)' : 'transparent',
                                    transition: '0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px'}}>
                                    {item.logoURI && <img src={item.logoURI} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                                    <span style={{ color: isSelected ? 'white' : '#888', fontWeight: isSelected ? 600 : 400 }}>{item.name}</span>
                                </div>
                                {isSelected && <Check size={18} color="#ff7120" />}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
            <GlowingCard spread={80} inactiveZone={0.01} glowColor="#ff7120" contentStyle={{ overflow: 'visible' }}>
                <div style={{ perspective: '1000px', width: '100%', height: '100%' }}>
                    {/* FLIP CONTAINER */}
                    <div 
                        style={{ 
                            position: 'relative', 
                            width: '100%', 
                            minHeight: '520px', 
                            transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                    >
                        {/* --- FRONT FACE (SWAP) --- */}
                        <div style={{ 
                            position: 'absolute', inset: 0, 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden',
                            background: '#0a0a0a', borderRadius: '24px', padding: '24px',
                            display: 'flex', flexDirection: 'column',
                            pointerEvents: isFlipped ? 'none' : 'auto' // Disable when flipped
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'white' }}>Exchange</h2>
                                <div 
                                    onClick={() => setIsFlipped(true)}
                                    style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#1f1f1f'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Settings size={20} color="#888" />
                                </div>
                            </div>

                             {/* Swap Content */}
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <AssetRow label="From" chain={fromChain} token={sellToken} onClick={openFromSelector} />
                                
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
                                
                                <AssetRow label="To" chain={toChain} token={buyToken} onClick={openToSelector} />
                            </div>

                            {/* Route Info */}
                            {activeRoute && (
                                 <div 
                                    onClick={() => setIsRoutesOpen(true)}
                                    style={{ 
                                        margin: '8px 4px 4px 4px', cursor: 'pointer',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        fontSize: '0.85rem', transition: 'opacity 0.2s'
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

                            {/* Input Area */}
                             <div style={{
                                background: '#131313', borderRadius: '16px', padding: '16px',
                                border: '1px solid #1f1f1f', marginTop: '12px'
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
                            </div>

                            {/* Action Button */}
                            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                 {account ? (
                                    isWrongNetwork ? (
                                        <button 
                                            onClick={handleSwitchNetwork}
                                            style={{
                                                width: '100%', background: '#ffcc00', color: 'black',
                                                border: 'none', borderRadius: '16px', padding: '16px',
                                                fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer',
                                            }}
                                        >
                                            Switch to {fromChain.name}
                                        </button>
                                    ) : (
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
                                    )
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

                             {/* Error Box */}
                            {(uiError || error) && (
                                <div style={{ 
                                    marginTop: '16px', textAlign: 'center', padding: '12px', 
                                    background: 'rgba(255, 50, 50, 0.15)', border: '1px solid rgba(255, 50, 50, 0.3)',
                                    color: '#ff6666', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 500 
                                }}>
                                    ⚠️ {uiError || error}
                                </div>
                            )}
                        </div>

                        {/* --- BACK FACE (SETTINGS) --- */}
                        <div style={{ 
                            position: 'absolute', inset: 0, 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: '#0a0a0a', borderRadius: '24px', padding: '24px',
                            display: 'flex', flexDirection: 'column',
                            pointerEvents: isFlipped ? 'auto' : 'none' // Enable only when flipped
                        }}>
                            {/* Settings Header */}
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', position: 'relative' }}>
                                 {settingsView === 'main' && (
                                    <div 
                                        onClick={() => setIsFlipped(false)}
                                        style={{ position: 'absolute', left: 0, cursor: 'pointer', padding: '8px' }}
                                    >
                                        <ArrowLeft size={20} color="#fff" />
                                    </div>
                                 )}
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>
                                    {settingsView === 'main' ? 'Settings' : settingsView === 'bridges' ? 'Bridges' : 'Exchanges'}
                                </h2>
                            </div>

                            {/* Settings Content */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                {settingsView === 'main' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <SettingItem 
                                            icon={({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>}
                                            label="Route priority" 
                                            value={routePriority} 
                                        />
                                        <SettingItem 
                                            icon={Fuel} 
                                            label="Gas price" 
                                            value={gasPrice} 
                                        />
                                        <SettingItem 
                                            icon={({size,color}) => <span style={{fontSize: size, fontWeight: 700, color: color}}>%</span>} 
                                            label="Max. slippage" 
                                            value={slippage} 
                                        />
                                        <SettingItem 
                                        icon={({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M4 14a2 0 1 0 0-4 2 2 0 0 0 0 4ZM10 8v8M14 8v8M20 14a2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>}
                                        label="Bridges" 
                                        value={isLoadingTools ? 'Loading...' : `${enabledBridges.length}/${availableBridges.length}`} 
                                        onClick={() => setSettingsView('bridges')}
                                    />
                                    <SettingItem 
                                        icon={({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></svg>} 
                                        label="Exchanges" 
                                        value={isLoadingTools ? 'Loading...' : `${enabledExchanges.length}/${availableExchanges.length}`} 
                                        onClick={() => setSettingsView('exchanges')}
                                    />
                                </div>
                            ) : settingsView === 'bridges' ? (
                                <ToggleList 
                                    title="Select Bridges"
                                    items={availableBridges}
                                    selectedKeys={enabledBridges}
                                    onToggle={(key) => toggleItem(key, enabledBridges, setEnabledBridges)}
                                    onBack={() => setSettingsView('main')}
                                />
                            ) : (
                                <ToggleList 
                                    title="Select Exchanges"
                                    items={availableExchanges}
                                    selectedKeys={enabledExchanges}
                                    onToggle={(key) => toggleItem(key, enabledExchanges, setEnabledExchanges)}
                                    onBack={() => setSettingsView('main')}
                                />
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </GlowingCard>

            <CombinedSelector 
                isOpen={isSelectorOpen} 
                onClose={() => setIsSelectorOpen(false)}
                title={selectorMode === 'from' ? 'Exchange from' : 'Exchange to'}
                selectedChain={selectorMode === 'from' ? fromChain : toChain}
                selectedToken={selectorMode === 'from' ? sellToken : buyToken}
                onSelect={handleSelection}
            />

            <RouteSelector 
                isOpen={isRoutesOpen}
                onClose={() => setIsRoutesOpen(false)}
                routes={routes}
                selectedRoute={activeRoute}
                onSelect={setActiveRoute}
            />
        </div>
    );
};

export default SwapCard;
