import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { Fuel, Settings, Wallet, ChevronDown, ArrowDown } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { useWallet } from '../contexts/WalletContext';
import CombinedSelector from './CombinedSelector';
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

    // Modal State
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorMode, setSelectorMode] = useState('from'); // 'from' or 'to'

    const { getQuotes, bestQuote, isLoading, error } = useAggregator();

    // Handlers for Opening Selector
    const openFromSelector = () => {
        setSelectorMode('from');
        setIsSelectorOpen(true);
    };
    
    const openToSelector = () => {
        setSelectorMode('to');
        setIsSelectorOpen(true);
    };

    const handleSelection = (chain, token) => {
        if (selectorMode === 'from') {
            setFromChain(chain);
            setSellToken(token);
        } else {
            setToChain(chain);
            setBuyToken(token);
        }
    };

    // --- Basic Fetch Logic (Same as before) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!fromAmount || parseFloat(fromAmount) === 0 || !sellToken || !buyToken) return;
            try {
                const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals).toString();
                getQuotes({
                    sellToken: sellToken.address,
                    buyToken: buyToken.address,
                    amount: amountWei,
                    userAddress: account,
                    fromChain: fromChain.id,
                    toChain: toChain.id
                });
            } catch (e) { }
        }, 600);
        return () => clearTimeout(timer);
    }, [fromAmount, sellToken, buyToken, fromChain, toChain, account]);

    useEffect(() => {
        if (bestQuote && buyToken) {
            const formatted = ethers.formatUnits(bestQuote.output, buyToken.decimals);
            setToAmount(parseFloat(formatted).toFixed(4));
        } else {
            setToAmount('');
        }
    }, [bestQuote, buyToken]);

    const executeSwap = async () => {
        if (!account) return connectWallet();
        if (!bestQuote) return;
        try {
            setSwapStatus('initiating');
            let activeSigner = signer;
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
            const isNative = sellToken.address === '0x0000000000000000000000000000000000000000';
            if (bestQuote.approvalAddress && !isNative) {
                const tokenContract = new ethers.Contract(sellToken.address, ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"], activeSigner);
                const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals);
                const allowance = await tokenContract.allowance(account, bestQuote.approvalAddress);
                if (allowance < amountWei) {
                    setSwapStatus('approving');
                    const tx = await tokenContract.approve(bestQuote.approvalAddress, amountWei);
                    await tx.wait();
                }
            }
            setSwapStatus('swapping');
            const txData = bestQuote.transactionRequest;
            const { from, gas, gasLimit, ...cleanTx } = txData;
            const val = txData.value ? BigInt(txData.value) : 0n;
            let limit = 500000n;
            if (gasLimit) limit = (BigInt(gasLimit) * 125n) / 100n;
            const tx = await activeSigner.sendTransaction({ ...cleanTx, value: val, gasLimit: limit });
            await tx.wait();
            setSwapStatus('idle');
            alert(`Success! Tx: ${tx.hash}`);
            setFromAmount('');
        } catch (err) {
            setSwapStatus('idle');
            alert(`Error: ${err.message}`);
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

                        {/* ROUTE DETAILS (Aggregator, Output, Gas) */}
                        {bestQuote && (
                            <div style={{ 
                                margin: '8px 4px 4px 4px', 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#888', fontSize: '0.75rem' }}>Receive</span>
                                    <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                                        {toAmount} {buyToken?.symbol}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 113, 32, 0.1)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255, 113, 32, 0.2)' }}>
                                    <span style={{ color: '#ff7120', fontWeight: 600 }}>{bestQuote.provider}</span>
                                    <div style={{ width: 1, height: 12, background: 'rgba(255, 113, 32, 0.3)' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff7120' }}>
                                        <Fuel size={12} />
                                        <span>${Number(bestQuote.gasCostUsd).toFixed(2)}</span>
                                    </div>
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
                                    disabled={isLoading || swapStatus !== 'idle' || !bestQuote}
                                    style={{
                                        width: '100%',
                                        background: (swapStatus !== 'idle' || !bestQuote) ? '#1f1f1f' : 'linear-gradient(90deg, #FF7120 0%, #FF4500 100%)',
                                        color: (swapStatus !== 'idle' || !bestQuote) ? '#555' : 'white',
                                        border: 'none', borderRadius: '16px', padding: '16px',
                                        fontSize: '1.2rem', fontWeight: 700,
                                        cursor: (swapStatus !== 'idle' || !bestQuote) ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {swapStatus === 'idle' ? (bestQuote ? 'Swap' : 'Enter Amount') : swapStatus.toUpperCase()}
                                </button>
                             ) : (
                                 <button 
                                    onClick={connectWallet}
                                    style={{
                                        width: '100%', background: '#3f1a94', color: 'white', // Explicit Purple from user reference image 2
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

                        {/* Best Route Info */}
                         {bestQuote && (
                            <div style={{ marginTop: '12px', padding: '0 8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Fuel size={12} /> ${Number(bestQuote.gasCostUsd).toFixed(2)}</div>
                                 <div style={{ color: '#ff7120' }}>Best via {bestQuote.provider}</div>
                            </div>
                        )}
                    </div>
                </div>
            </GlowingCard>

            {/* THE NEW COMBINED MODAL */}
            <CombinedSelector 
                isOpen={isSelectorOpen} 
                onClose={() => setIsSelectorOpen(false)}
                title={selectorMode === 'from' ? 'Exchange from' : 'Exchange to'}
                selectedChain={selectorMode === 'from' ? fromChain : toChain}
                selectedToken={selectorMode === 'from' ? sellToken : buyToken}
                onSelect={handleSelection}
            />
        </div>
    );
};

export default SwapCard;
