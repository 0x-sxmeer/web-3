import React, { useState, useEffect, useRef } from 'react';
import { GlowingCard } from './GlowingCard';
import { ChevronDown, ArrowDown, Wallet, Loader2, RefreshCw, Zap, Fuel } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { TOKENS } from '../services/web3Service';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { getTokensForNetwork } from '../services/tokenLists';

import TokenSelector from './TokenSelector';

const SwapCard = () => {
    // Core State
    const { account, balance, connectWallet, signer, chainId, networkName } = useWallet();
    const [mockMode, setMockMode] = useState(false);
    
    // Token State
    const [sellToken, setSellToken] = useState({ 
        symbol: 'ETH', 
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 
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
    
    // Config State
    const [gasSpeed, setGasSpeed] = useState('standard'); 
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [timeLeft, setTimeLeft] = useState(15);
    
    // Aggregator Hook
    const { getQuotes, bestQuote, quotes, isLoading, error } = useAggregator();

    // Refresh Timer Logic
    useEffect(() => {
        if (!autoRefresh) return;
        
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleFetchQuotes();
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [autoRefresh, fromAmount, sellToken, buyToken]); // Add token deps

    // Fetch Quotes Wrapper
    const handleFetchQuotes = () => {
        if (!fromAmount || parseFloat(fromAmount) === 0) return;
        
        try {
            const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals).toString();
            console.log("Fetching quotes for:", amountWei, "on chain:", chainId);
            
            getQuotes({
                sellToken: sellToken.address, 
                buyToken: buyToken.address, 
                amount: amountWei,
                userAddress: account || '0x0000000000000000000000000000000000000000',
                buyTokenDecimals: buyToken.decimals,
                chainId: Number(chainId) || 1 // Pass current chain ID
            });
        } catch (e) {
            console.error("Invalid amount", e);
        }
    };

    // Trigger fetch on amount change (debounced) or when account connects
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFetchQuotes();
            setTimeLeft(15); // Reset timer
        }, 600);
        return () => clearTimeout(timeoutId);
    }, [fromAmount, sellToken, buyToken, account]); // Added account dependency
    
    // UI Selection State
    const [selectedQuote, setSelectedQuote] = useState(null);

    // Auto-select the best quote when quotes update
    // Auto-select logic with sticky manual selection
    useEffect(() => {
        if (quotes.length > 0 && bestQuote) {
            if (selectedQuote) {
                // Try to keep the same provider if available in new quotes
                const matching = quotes.find(q => q.provider === selectedQuote.provider);
                if (matching) {
                    setSelectedQuote(matching);
                } else {
                    // Fallback to best if provider no longer available
                    setSelectedQuote(bestQuote);
                }
            } else {
                // Initial selection
                setSelectedQuote(bestQuote);
            }
        }
    }, [quotes, bestQuote, selectedQuote]);

    // Reset selection on major input changes to allow "Best" to win again
    useEffect(() => {
        setSelectedQuote(null);
    }, [fromAmount, sellToken, buyToken]);

    // Update ToAmount when SELECTED quote changes
    useEffect(() => {
        if (selectedQuote) {
            // Use dynamic decimals
            const formatted = ethers.formatUnits(selectedQuote.output, buyToken.decimals);
            setToAmount(parseFloat(formatted).toFixed(4));
        }
    }, [selectedQuote, buyToken]); 


    const [swapStatus, setSwapStatus] = useState('idle'); // idle, approving, swapping, success

    // Minimal ERC20 ABI for Approvals
    const ERC20_ABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const executeSwap = async () => {
        console.log("=== SWAP BUTTON CLICKED ===");
        console.log("Account:", account);
        console.log("Selected Quote:", selectedQuote);
        console.log("Signer:", signer);
        console.log("Mock Mode:", mockMode);
        
        if (!account) {
            console.error("❌ Swap blocked: No account connected");
            alert("Please connect your wallet first!");
            return;
        }
        
        if (!selectedQuote) {
            console.error("❌ Swap blocked: No quote selected");
            alert("No quote available. Please wait for quotes to load.");
            return;
        }
        
        if (!signer && !mockMode) {
            console.error("❌ Swap blocked: No signer available");
            alert("Wallet not properly connected. Please reconnect your wallet.");
            return;
        }
        
        // MOCK MODE: Simulate swap without real transaction
        if (mockMode) {
            console.log("🎭 MOCK MODE: Simulating swap...");
            setSwapStatus('initiating');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSwapStatus('swapping');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setSwapStatus('success');
            alert(`✅ Mock Swap Completed!\n\nSwapped ${fromAmount} ${sellToken.symbol} for ~${toAmount} ${buyToken.symbol}\n\n(This was a simulated transaction)`);
            setSwapStatus('idle');
            return;
        }
        
        
        // 1. SAFETY CHECK: Ensure we are on the correct chain
        try {
            const network = await signer.provider.getNetwork();
            const currentChainId = Number(network.chainId);
            const expectedChainId = Number(chainId) || 1;
            
            console.log("Network Check:", { currentChainId, expectedChainId });
            
            if (currentChainId !== expectedChainId) {
                console.log("⚠️ Network mismatch detected. Attempting auto-switch...");
                
                // Convert chainId to hex format for wallet_switchEthereumChain
                const chainIdHex = '0x' + expectedChainId.toString(16);
                
                try {
                    // Attempt to switch network automatically
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainIdHex }],
                    });
                    
                    console.log("✅ Network switched successfully!");
                    alert(`Network switched to ${networkName}!\n\nPlease click "SWAP NOW" again to execute the swap.`);
                    return; // User needs to click swap again after network switch
                    
                } catch (switchError) {
                    console.error("Network switch failed:", switchError);
                    
                    // If user rejected the switch or it failed
                    if (switchError.code === 4001) {
                        alert(`Network Switch Rejected\n\nYou need to be on ${networkName} (Chain ${expectedChainId}) to execute this swap.\n\nPlease switch networks manually in your wallet.`);
                    } else {
                        alert(`Failed to switch network automatically.\n\nPlease manually switch your wallet to ${networkName} (Chain ${expectedChainId}).`);
                    }
                    return;
                }
            }
        } catch (networkError) {
            console.error("Network check failed:", networkError);
            alert("Failed to verify network. Please check your wallet connection.");
            return;
        }
        
        
        setSwapStatus('initiating');

        try {
            const userAddress = account;
            
            // Use selectedQuote for execution
            const quoteToExecute = selectedQuote;
            console.log("Executing Quote:", quoteToExecute);

            // 2. APPROVAL CHECK (If selling ERC20)
            if (sellToken.symbol !== 'ETH') {
                // Determine Spender
                let spender = null;
                if (quoteToExecute.provider === '0x') {
                    // 0x usually provides allowanceTarget
                    spender = quoteToExecute.data.allowanceTarget || quoteToExecute.data.to; 
                } else if (quoteToExecute.provider === '1inch') {
                    // 1inch swap response puts router in tx.to
                    spender = quoteToExecute.data.tx?.to;
                }

                if (!spender) {
                    throw new Error(`Could not determine approval spender for ${quoteToExecute.provider}`);
                }

                const tokenContract = new ethers.Contract(sellToken.address, ERC20_ABI, signer);
                const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals);
                
                // Check Allowance
                const allowance = await tokenContract.allowance(userAddress, spender);
                
                if (allowance < amountWei) {
                    setSwapStatus('approving');
                    const approveTx = await tokenContract.approve(spender, amountWei);
                    await approveTx.wait();
                }
            }

            // 3. EXECUTE SWAP
            setSwapStatus('swapping');
            
            let txParams = {};
            if (quoteToExecute.provider === '0x') {
                txParams = {
                    to: quoteToExecute.data.to,
                    data: quoteToExecute.data.data,
                    value: quoteToExecute.data.value || "0"
                };
            } else if (quoteToExecute.provider === '1inch') {
                txParams = {
                    to: quoteToExecute.data.tx.to,
                    data: quoteToExecute.data.tx.data,
                    value: quoteToExecute.data.tx.value || "0"
                };
            }

            if (!txParams.to || !txParams.data) {
                throw new Error(`Invalid Transaction Params: to=${txParams.to}, data=${txParams.data ? 'present' : 'missing'}`);
            }

            // 4. GAS ESTIMATION (Critical for professional feel)
            console.log("Estimating gas...");
            try {
                const estimatedGas = await signer.estimateGas(txParams);
                // Add a 10% buffer to the gas limit to prevent "Out of Gas" errors
                txParams.gasLimit = (estimatedGas * 110n) / 100n;
                console.log("Gas estimated:", estimatedGas.toString(), "with buffer:", txParams.gasLimit.toString());
            } catch (gasError) {
                console.warn("⚠️ Gas estimation failed, transaction might revert", gasError);
                // We proceed anyway but warn the user or set a high default
                txParams.gasLimit = 300000n; // Safe default fallback
                console.log("Using fallback gas limit:", txParams.gasLimit.toString());
            }

            console.log("Sending Transaction:", txParams);
            const tx = await signer.sendTransaction(txParams);
            console.log("Transaction Sent:", tx);
            await tx.wait();
            console.log("Transaction Mined");

            setSwapStatus('success');
            alert(`Swap Completed! Tx Hash: ${tx.hash}`);
            setSwapStatus('idle'); // Reset after success
            handleFetchQuotes();   // Refresh quotes

        } catch (err) {
            console.error("Swap Error:", err);
            setSwapStatus('idle');
            // Extract meaningful error message
            let msg = err.reason || err.message || "Unknown Error";
            if (msg.includes("user rejected")) msg = "User rejected transaction";
            alert("Swap Failed: " + msg);
        }
    };

    return (
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
            <GlowingCard 
                spread={80} 
                inactiveZone={0.01} 
                gradient="conic-gradient(from var(--start) at 50% 50%, transparent 0deg, #ff9f1c 20deg, #ff5e00 45deg, transparent 90deg)"
                glowColor="#ff7120"
            >
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Header with Settings */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Swap</h2>
                            
                            {/* Network Badge */}
                            {chainId && (
                                <div style={{
                                    background: chainId === 11155111n ? 'rgba(255, 165, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                    border: `1px solid ${chainId === 11155111n ? 'rgba(255, 165, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: chainId === 11155111n ? '#FFA500' : '#4CAF50'
                                }}>
                                    {networkName}
                                </div>
                            )}
                            
                            {/* Refresh Timer */}
                            <div 
                                onClick={() => { setAutoRefresh(!autoRefresh); handleFetchQuotes(); }}
                                style={{ 
                                    width: 24, height: 24, 
                                    borderRadius: '50%', 
                                    border: `2px solid ${autoRefresh ? 'var(--accent-color)' : '#444'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    color: autoRefresh ? 'var(--accent-color)' : '#666',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                {timeLeft}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Mock Mode Toggle */}
                            <div 
                                onClick={() => setMockMode(!mockMode)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: mockMode ? 'rgba(255, 165, 0, 0.1)' : 'transparent',
                                    border: `1px solid ${mockMode ? 'rgba(255, 165, 0, 0.3)' : 'transparent'}`,
                                    transition: 'all 0.2s'
                                }}
                                title="Mock mode simulates swaps without real transactions"
                            >
                                <div style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: mockMode ? '#FFA500' : '#444'
                                }}></div>
                                <span style={{ fontSize: '0.7rem', color: mockMode ? '#FFA500' : '#666' }}>
                                    {mockMode ? 'MOCK' : 'LIVE'}
                                </span>
                            </div>

                            {/* Gas Toggle */}
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '2px' }}>
                                {['economy', 'standard', 'fast'].map((speed) => (
                                    <button
                                        key={speed}
                                        onClick={() => setGasSpeed(speed)}
                                        style={{
                                            background: gasSpeed === speed ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '16px',
                                            padding: '4px 8px',
                                            fontSize: '0.7rem',
                                            color: gasSpeed === speed ? 'white' : '#888',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {speed === 'fast' && <Zap size={10} style={{marginRight:2}} fill="currentColor"/>}
                                        {speed}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* From Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You pay</span>
                            <span>Balance: {sellToken.symbol === 'ETH' ? (account ? balance : '---') : '---'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                                type="number" 
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                placeholder="0"
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'white', 
                                    fontSize: '2rem', 
                                    fontFamily: 'var(--font-display)', 
                                    width: '60%',
                                    outline: 'none'
                                }} 
                            />
                            <TokenSelector selectedToken={sellToken} onSelect={setSellToken} />
                        </div>
                    </div>

                    {/* Arrow Divider */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-1rem 0' }}>
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '0.8rem', padding: '0.5rem', cursor: 'pointer', zIndex: 10 }}>
                            <ArrowDown size={20} color="var(--text-muted)" />
                        </div>
                    </div>

                    {/* To Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You receive</span>
                            {selectedQuote && (
                                <span style={{color: selectedQuote.isBest ? '#4CAF50' : 'var(--text-muted)', fontSize:'0.8rem'}}>
                                    Via {selectedQuote.provider} {selectedQuote.isBest && '(Best)'}
                                </span>
                            )}
                        </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             {isLoading ? (
                                <div style={{ width: '60%', height: '38px', display: 'flex', alignItems: 'center' }}>
                                    <Loader2 className="animate-spin" color="#ff7120" />
                                </div>
                            ) : (
                                <input 
                                    type="number" 
                                    value={toAmount}
                                    readOnly
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        color: 'white', 
                                        fontSize: '2rem', 
                                        fontFamily: 'var(--font-display)', 
                                        width: '60%',
                                        outline: 'none'
                                    }} 
                                />
                            )}
                            <TokenSelector selectedToken={buyToken} onSelect={setBuyToken} />
                        </div>
                    </div>

                    {/* Aggregator Comparison */}
                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                            MULTI-AGGREGATOR RACE (Select One)
                        </div>
                        
                        {error && <div style={{color:'red', fontSize:'0.8rem'}}>{error}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {quotes.length === 0 && !isLoading && !error && (
                                <div style={{textAlign:'center', color:'#555', fontSize:'0.9rem', padding:'1rem'}}>Enter amount to start race</div>
                            )}
                            
                            {quotes.map((quote, i) => {
                                const outputFmt = parseFloat(ethers.formatUnits(quote.output, TOKENS.USDC.decimals)).toFixed(4);
                                const netValueStr = quote.netValueUsd ? `$${quote.netValueUsd.toFixed(2)}` : '---';
                                const gasCostStr = quote.gasCostUsd ? `$${quote.gasCostUsd.toFixed(2)}` : '---';
                                
                                const isSelected = selectedQuote && selectedQuote.provider === quote.provider;
                                const isError = !!quote.error;

                                return (
                                <div 
                                    key={i} 
                                    onClick={() => !isError && setSelectedQuote(quote)}
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '0.8rem', 
                                        borderRadius: '0.8rem', 
                                        background: isError ? 'rgba(255,0,0,0.05)' : (isSelected ? 'rgba(255, 113, 32, 0.2)' : (quote.isBest ? 'rgba(255, 113, 32, 0.05)' : 'rgba(255,255,255,0.03)')),
                                        border: isError ? '1px solid rgba(255,0,0,0.1)' : (isSelected ? '1px solid var(--accent-color)' : (quote.isBest ? '1px solid rgba(255, 113, 32, 0.3)' : '1px solid transparent')),
                                        cursor: isError ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: isError ? 0.6 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{quote.provider}</div>
                                            {quote.isBest && !isError && <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>WINNER</span>}
                                            {isError && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>FAILED</span>}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                            {isError ? (
                                                <span style={{color:'#ef4444'}}>
                                                    {quote.error.length > 25 ? quote.error.substring(0,25)+'...' : quote.error}
                                                </span>
                                            ) : (
                                                <>Net Value: <span style={{color: quote.isBest ? 'var(--accent-color)' : '#bbb', fontWeight:'600'}}>{netValueStr}</span></>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, color: isError ? '#ef4444' : (quote.isBest ? 'var(--accent-color)' : 'var(--text-color)') }}>
                                            {isError ? 'Unavailable' : `${outputFmt} USDC`}
                                        </div>
                                        {!isError && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px' }}>
                                                <Fuel size={10} /> Gas: <span style={{color:'#f87171'}}>-{gasCostStr}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <button 
                            disabled={!account || isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)}
                            onClick={!account ? connectWallet : executeSwap}
                            style={{
                            width: '100%',
                            background: (isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)) ? '#333' : 'var(--accent-color)',
                            border: 'none',
                            padding: '1.2rem',
                            borderRadius: '1rem',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            fontFamily: 'var(--font-display)',
                            cursor: (!account || isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: (!account || isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)) ? 0.7 : 1
                        }}>
                             {!account ? 'CONNECT WALLET' : 
                                isLoading ? 'FETCHING QUOTES...' :
                                !selectedQuote && !mockMode ? 'WAITING FOR QUOTE...' :
                                swapStatus === 'initiating' ? 'INITIATING...' :
                                swapStatus === 'approving' ? 'APPROVING...' :
                                swapStatus === 'swapping' ? 'SWAPPING...' :
                                'SWAP NOW'}
                        </button>
                    </div>
                </div>
            </GlowingCard>
        </div>
    );
};

export default SwapCard;
