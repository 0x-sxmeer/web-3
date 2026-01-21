import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { ArrowDown, Loader2, Fuel, Zap, Globe } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { useWallet } from '../contexts/WalletContext';
import TokenSelector from './TokenSelector';
import { ethers } from 'ethers';

// Supported Chains Configuration
const CHAINS = [
    { id: 1, name: 'Ethereum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
    { id: 56, name: 'BSC', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png' },
    { id: 137, name: 'Polygon', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' },
    { id: 42161, name: 'Arbitrum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' },
    { id: 10, name: 'Optimism', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' },
    { id: 8453, name: 'Base', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' },
];

const ChainSelector = ({ selectedChain, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const current = CHAINS.find(c => c.id === selectedChain) || CHAINS[0];

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '6px 10px', color: 'white', 
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginBottom: '8px'
                }}
            >
                <img src={current.logo} style={{ width: 16, height: 16, borderRadius: '50%' }} alt={current.name} />
                {current.name}
                <ArrowDown size={12} />
            </button>

            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />
                    <div style={{
                        position: 'absolute', top: '110%', left: 0, width: '160px',
                        background: '#1a1b1e', border: '1px solid #333', borderRadius: '12px',
                        padding: '6px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px'
                    }}>
                        {CHAINS.map(chain => (
                            <div 
                                key={chain.id}
                                onClick={() => { onSelect(chain.id); setIsOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                    background: selectedChain === chain.id ? 'rgba(255,113,32,0.1)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedChain === chain.id ? 'rgba(255,113,32,0.1)' : 'transparent'}
                            >
                                <img src={chain.logo} style={{ width: 20, height: 20, borderRadius: '50%' }} alt={chain.name} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{chain.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const SwapCard = () => {
    const { account, balance, connectWallet, signer } = useWallet();
    
    // Chains
    const [fromChain, setFromChain] = useState(1); // Default ETH
    const [toChain, setToChain] = useState(1);     // Default ETH

    // Tokens (Reset when chain changes is handled in TokenSelector usually, but we need to reset here if chain changes)
    const [sellToken, setSellToken] = useState(null);
    const [buyToken, setBuyToken] = useState(null);

    // Reset tokens when chain changes to avoid "ETH on Polygon" errors
    useEffect(() => {
        setSellToken(null); 
    }, [fromChain]);

    useEffect(() => {
        setBuyToken(null);
    }, [toChain]);

    const [fromAmount, setFromAmount] = useState('1');
    const [toAmount, setToAmount] = useState('0.00');
    const [swapStatus, setSwapStatus] = useState('idle');

    const { getQuotes, bestQuote, isLoading, error } = useAggregator();

    // Fetch quotes
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
                    fromChain: fromChain,
                    toChain: toChain
                });
            } catch (e) {
                console.error("Quote Error:", e);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [fromAmount, sellToken, buyToken, account, fromChain, toChain]);

    // Update UI output
    useEffect(() => {
        if (bestQuote) {
            const formatted = ethers.formatUnits(bestQuote.output, bestQuote.outputDecimals);
            setToAmount(parseFloat(formatted).toFixed(6));
        } else {
            setToAmount('0.00');
        }
    }, [bestQuote]);

    const executeSwap = async () => {
        if (!account) return connectWallet();
        if (!bestQuote) return;

        try {
            setSwapStatus('initiating');
            let activeSigner = signer;
            
            // 1. Force Chain Switch to Source Chain
            const currentChain = Number((await signer.provider.getNetwork()).chainId);
            if (currentChain !== fromChain) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + fromChain.toString(16) }],
                    });
                    // Re-init signer after switch
                    const newProvider = new ethers.BrowserProvider(window.ethereum);
                    activeSigner = await newProvider.getSigner();
                } catch (e) {
                    alert("Please switch network in your wallet.");
                    setSwapStatus('idle');
                    return;
                }
            }

            // 2. Approve Token (if not Native)
            const isNative = sellToken.address === '0x0000000000000000000000000000000000000000';
            if (bestQuote.approvalAddress && !isNative) {
                const tokenContract = new ethers.Contract(
                    sellToken.address, 
                    ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"], 
                    activeSigner
                );
                const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals);
                const allowance = await tokenContract.allowance(account, bestQuote.approvalAddress);
                
                if (allowance < amountWei) {
                    setSwapStatus('approving');
                    const tx = await tokenContract.approve(bestQuote.approvalAddress, amountWei);
                    await tx.wait();
                }
            }

            // 3. Execute Transaction
            setSwapStatus('swapping');
            const txData = bestQuote.transactionRequest;
            
            // FIX: Ethers v6 throws if 'from' is present in signer.sendTransaction
            // We strip 'from', 'gas', and 'gasLimit' to reconstruct them safely
            const { from, gas, gasLimit, ...cleanTx } = txData;

            // Safe BigInt Parsing
            const val = txData.value ? BigInt(txData.value) : 0n;
            
            // Gas Limit with Buffer
            let limit = 500000n; // Fallback
            const apiGas = gasLimit || gas;
            if (apiGas) {
                limit = (BigInt(apiGas) * 125n) / 100n; // +25% buffer
            }

            const finalTx = {
                ...cleanTx,
                value: val,
                gasLimit: limit
            };

            const tx = await activeSigner.sendTransaction(finalTx);
            await tx.wait();
            
            setSwapStatus('idle');
            alert(`Swap Successful! Hash: ${tx.hash}`);
            setFromAmount('0');

        } catch (err) {
            setSwapStatus('idle');
            // Extract readable error
            const msg = err.info?.error?.message || err.shortMessage || err.message;
            alert(`Transaction Failed: ${msg}`);
        }
    };

    return (
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
            <GlowingCard spread={80} inactiveZone={0.01} glowColor="#ff7120">
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Swap</h2>
                        {/* Optional: Add slippage settings icon here */}
                    </div>

                    {/* FROM SECTION */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <ChainSelector selectedChain={fromChain} onSelect={setFromChain} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Balance: {balance}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                                type="number" 
                                value={fromAmount} 
                                onChange={(e) => setFromAmount(e.target.value)} 
                                placeholder="0"
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', width: '60%', outline: 'none' }} 
                            />
                            <TokenSelector 
                                selectedToken={sellToken} 
                                onSelect={setSellToken} 
                                chainId={fromChain} 
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-1rem 0', zIndex: 10 }}>
                        <div 
                            onClick={() => {
                                // Swap Chains and Tokens
                                const tempChain = fromChain; setFromChain(toChain); setToChain(tempChain);
                                const tempToken = sellToken; setSellToken(buyToken); setBuyToken(tempToken);
                            }}
                            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '0.8rem', padding: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <ArrowDown size={20} color="var(--text-muted)" />
                        </div>
                    </div>

                    {/* TO SECTION */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <ChainSelector selectedChain={toChain} onSelect={setToChain} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You receive</span>
                        </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             {isLoading ? <Loader2 className="animate-spin" color="#ff7120" /> : 
                                <input 
                                    type="text" 
                                    value={toAmount} 
                                    readOnly 
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', width: '60%', outline: 'none' }} 
                                />
                             }
                            <TokenSelector 
                                selectedToken={buyToken} 
                                onSelect={setBuyToken} 
                                chainId={toChain} 
                            />
                        </div>
                    </div>

                    {bestQuote && (
                        <div style={{ padding: '1rem', background: 'rgba(255,113,32,0.1)', borderRadius: '0.8rem', border: '1px solid rgba(255,113,32,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                <span style={{display:'flex', alignItems:'center', gap:'6px'}}><Zap size={14} fill="currentColor" /> via <b>{bestQuote.provider}</b></span>
                                <span style={{ fontWeight: 'bold', color: '#ff7120' }}>Best Route</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Fuel size={12}/> Est. Fees</span>
                                <span>${Number(bestQuote.gasCostUsd || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    
                    {error && <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '0.8rem', color: '#ff4d4d', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                    <button 
                        onClick={executeSwap} 
                        disabled={isLoading || swapStatus !== 'idle' || !bestQuote} 
                        style={{ 
                            width: '100%', 
                            background: (swapStatus !== 'idle' || !bestQuote) ? '#333' : 'var(--accent-color)', 
                            border: 'none', padding: '1.2rem', borderRadius: '1rem', 
                            color: 'white', fontWeight: 700, fontSize: '1rem', 
                            cursor: (swapStatus !== 'idle' || !bestQuote) ? 'not-allowed' : 'pointer', 
                            opacity: (swapStatus !== 'idle' || !bestQuote) ? 0.7 : 1 
                        }}
                    >
                         {swapStatus === 'idle' ? (account ? 'SWAP NOW' : 'CONNECT WALLET') : swapStatus.toUpperCase() + '...'}
                    </button>
                </div>
            </GlowingCard>
        </div>
    );
};

export default SwapCard;
