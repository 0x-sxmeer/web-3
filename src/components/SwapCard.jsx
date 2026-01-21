import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { ArrowDown, Loader2, Fuel, Zap } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { useWallet } from '../contexts/WalletContext';
import TokenSelector from './TokenSelector';
import { ethers } from 'ethers';

const SwapCard = () => {
    // --- State Management ---
    const { account, balance, connectWallet, signer, chainId } = useWallet();
    const [mockMode, setMockMode] = useState(false);
    
    // Chains (Hardcoded to Ethereum for now, but ready for Jumper cross-chain)
    const [fromChain, setFromChain] = useState(1);
    const [toChain, setToChain] = useState(1);

    // Tokens
    const [sellToken, setSellToken] = useState({ 
        symbol: 'ETH', 
        address: '0x0000000000000000000000000000000000000000', // Jumper uses 0x0 for native ETH
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' 
    });
    const [buyToken, setBuyToken] = useState({ 
        symbol: 'USDC', 
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' 
    });

    const [fromAmount, setFromAmount] = useState('1');
    const [toAmount, setToAmount] = useState('0.00');
    const [swapStatus, setSwapStatus] = useState('idle');

    // --- Hooks ---
    const { getQuotes, bestQuote, quotes, isLoading, error } = useAggregator();

    // --- Debounced Fetching ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!fromAmount || parseFloat(fromAmount) === 0) return;
            
            const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals).toString();
            
            getQuotes({
                sellToken: sellToken.address,
                buyToken: buyToken.address,
                amount: amountWei,
                userAddress: account,
                fromChain: fromChain,
                toChain: toChain
            });
        }, 600);
        return () => clearTimeout(timer);
    }, [fromAmount, sellToken, buyToken, account, fromChain, toChain]);

    // --- Update UI with Quote Results ---
    useEffect(() => {
        if (bestQuote) {
            const formatted = ethers.formatUnits(bestQuote.output, bestQuote.outputDecimals);
            setToAmount(parseFloat(formatted).toFixed(4));
        } else {
            setToAmount('0.00');
        }
    }, [bestQuote]);

    // --- Execution Logic (Fixing the Errors) ---
    const executeSwap = async () => {
        if (!account) return connectWallet();
        if (!bestQuote && !mockMode) return;

        // 1. Mock Mode Check
        if (mockMode) {
            setSwapStatus('swapping');
            await new Promise(r => setTimeout(r, 2000));
            setSwapStatus('idle');
            alert('Mock Swap Success!');
            return;
        }

        try {
            setSwapStatus('initiating');

            // 2. Network Switch
            // Ensure wallet is on the 'fromChain'
            const currentChain = Number((await signer.provider.getNetwork()).chainId);
            if (currentChain !== fromChain) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + fromChain.toString(16) }],
                    });
                    // Update signer after switch
                    const newProvider = new ethers.BrowserProvider(window.ethereum);
                    var activeSigner = await newProvider.getSigner();
                } catch (switchError) {
                    alert("Please switch your wallet network to continue.");
                    setSwapStatus('idle');
                    return;
                }
            } else {
                var activeSigner = signer;
            }

            // 3. Approval Flow (Corrected)
            // Jumper/Li.Fi tells us exactly who to approve in `approvalAddress`
            if (bestQuote.approvalAddress && sellToken.symbol !== 'ETH') {
                const tokenContract = new ethers.Contract(
                    sellToken.address, 
                    ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"], 
                    activeSigner
                );
                
                const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals);
                const currentAllowance = await tokenContract.allowance(account, bestQuote.approvalAddress);

                if (currentAllowance < amountWei) {
                    setSwapStatus('approving');
                    const tx = await tokenContract.approve(bestQuote.approvalAddress, amountWei);
                    await tx.wait();
                }
            }

            // 4. Execution Flow (The Fix)
            // Instead of constructing the TX manually, we use the `transactionRequest` 
            // provided directly by the API. This eliminates errors with gas/data formatting.
            setSwapStatus('swapping');

            const txRequest = {
                to: bestQuote.transactionRequest.to,
                data: bestQuote.transactionRequest.data,
                value: bestQuote.transactionRequest.value, // Handles ETH value correctly
                from: account, // Ensure 'from' is set
                // Li.Fi gives a recommended gas limit, we add a tiny buffer
                gasLimit: BigInt(bestQuote.transactionRequest.gasLimit) * 110n / 100n 
            };

            const tx = await activeSigner.sendTransaction(txRequest);
            console.log("Tx Hash:", tx.hash);
            
            await tx.wait();
            setSwapStatus('idle');
            alert(`Swap Successful! \nHash: ${tx.hash}`);
            setFromAmount('0'); // Reset

        } catch (err) {
            console.error("Execution Error:", err);
            setSwapStatus('idle');
            // Friendly error extraction
            const msg = err.reason || err.data?.message || err.message;
            alert(`Swap Failed: ${msg.includes('user rejected') ? 'User rejected transaction' : msg}`);
        }
    };

    return (
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
            <GlowingCard spread={80} inactiveZone={0.01} glowColor="#ff7120">
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Swap</h2>
                        <div 
                            onClick={() => setMockMode(!mockMode)}
                            style={{ 
                                fontSize: '0.7rem', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                background: mockMode ? '#ff7120' : '#333', 
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {mockMode ? 'MOCK MODE' : 'LIVE'}
                        </div>
                    </div>

                    {/* From Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You pay</span>
                            <span>Balance: {balance}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                                type="number" 
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', fontFamily: 'var(--font-display)', width: '60%', outline: 'none' }} 
                            />
                            {/* Pass mock 'eth' address for LI.FI native token */}
                            <TokenSelector selectedToken={sellToken} onSelect={setSellToken} />
                        </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-1rem 0', zIndex: 10 }}>
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '0.8rem', padding: '0.5rem' }}>
                            <ArrowDown size={20} color="var(--text-muted)" />
                        </div>
                    </div>

                    {/* To Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You receive</span>
                        </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             {isLoading ? (
                                <Loader2 className="animate-spin" color="#ff7120" />
                            ) : (
                                <input 
                                    type="number" 
                                    value={toAmount}
                                    readOnly
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', fontFamily: 'var(--font-display)', width: '60%', outline: 'none' }} 
                                />
                            )}
                            <TokenSelector selectedToken={buyToken} onSelect={setBuyToken} />
                        </div>
                    </div>

                    {/* Route Info */}
                    {bestQuote && (
                        <div style={{ padding: '1rem', background: 'rgba(255,113,32,0.1)', borderRadius: '0.8rem', border: '1px solid rgba(255,113,32,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                <span style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                    <Zap size={14} fill="currentColor" />
                                    via <b>{bestQuote.provider}</b>
                                </span>
                                <span style={{ fontWeight: 'bold', color: '#ff7120' }}>Best Return</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Fuel size={12}/> Est. Gas</span>
                                <span>${bestQuote.gasCostUsd.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '0.8rem', color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {/* Swap Button */}
                    <button 
                        onClick={executeSwap}
                        disabled={isLoading || swapStatus !== 'idle'}
                        style={{
                            width: '100%',
                            background: swapStatus !== 'idle' ? '#333' : 'var(--accent-color)',
                            border: 'none', padding: '1.2rem', borderRadius: '1rem',
                            color: 'white', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-display)',
                            cursor: swapStatus !== 'idle' ? 'not-allowed' : 'pointer',
                            opacity: swapStatus !== 'idle' ? 0.7 : 1
                        }}>
                         {swapStatus === 'idle' ? 'SWAP NOW' : swapStatus.toUpperCase() + '...'}
                    </button>
                </div>
            </GlowingCard>
        </div>
    );
};

export default SwapCard;
