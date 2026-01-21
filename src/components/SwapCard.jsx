import React, { useState, useEffect } from 'react';
import { GlowingCard } from './GlowingCard';
import { ChevronDown, ArrowDown, Wallet, Loader2 } from 'lucide-react';
import { useAggregator } from '../hooks/useAggregator';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { TOKENS } from '../services/web3Service'; 
import TokenSelector from './TokenSelector';

const SwapCard = () => {
    // Core State
    const { account, balance, connectWallet, signer, chainId, networkName } = useWallet();
    const [mockMode, setMockMode] = useState(false);
    
    // Manual Target Chain State
    const [targetChain, setTargetChain] = useState(1); 

    // Sync targetChain with wallet IF connected to a supported chain
    useEffect(() => {
        if (chainId) {
            const supported = [1, 56, 137];
            if (supported.includes(Number(chainId))) {
                setTargetChain(Number(chainId));
            }
        }
    }, [chainId]);

    // Token State
    const [sellToken, setSellToken] = useState(null);
    const [buyToken, setBuyToken] = useState(null);

    // Set default tokens based on chain
    useEffect(() => {
        if (targetChain === 56) { // BSC Defaults
            setSellToken({ symbol: 'BNB', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' });
            setBuyToken({ symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18, logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' });
        } else if (targetChain === 137) { // Polygon Defaults
            setSellToken({ symbol: 'MATIC', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' });
            setBuyToken({ symbol: 'USDC', address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', decimals: 6, logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' });
        } else { // ETH Defaults
            setSellToken({ symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' });
            setBuyToken({ symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' });
        }
    }, [targetChain]);

    const [fromAmount, setFromAmount] = useState('1');
    const [toAmount, setToAmount] = useState('0.00');
    
    // Config State
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [timeLeft, setTimeLeft] = useState(15);
    
    // Aggregator Hook
    const { getQuotes, bestQuote, quotes, isLoading, error } = useAggregator();

    // Fetch Quotes Logic
    const handleFetchQuotes = () => {
        if (!fromAmount || parseFloat(fromAmount) === 0 || !sellToken || !buyToken) return;
        
        try {
            const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals).toString();
            console.log(`Fetching quotes for Chain ${targetChain}...`);
            
            getQuotes({
                sellToken: sellToken.address, 
                buyToken: buyToken.address, 
                amount: amountWei,
                userAddress: account || '0x0000000000000000000000000000000000000000',
                buyTokenDecimals: buyToken.decimals,
                chainId: targetChain
            });
        } catch (e) {
            console.error("Quote fetch error", e);
        }
    };

    // Trigger fetch on input change
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFetchQuotes();
            setTimeLeft(15);
        }, 600);
        return () => clearTimeout(timer);
    }, [fromAmount, sellToken, buyToken, targetChain, account]);

    // Refresh Timer
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
    }, [autoRefresh, fromAmount, sellToken, buyToken, targetChain]);


    // UI Selection State
    const [selectedQuote, setSelectedQuote] = useState(null);

    // Auto-select best quote
    useEffect(() => {
        if (quotes.length > 0 && bestQuote) {
            if (selectedQuote) {
                const matching = quotes.find(q => q.provider === selectedQuote.provider);
                if (matching) setSelectedQuote(matching);
                else setSelectedQuote(bestQuote);
            } else {
                setSelectedQuote(bestQuote);
            }
        }
    }, [quotes, bestQuote, selectedQuote]);

    // Output Display
    useEffect(() => {
        if (selectedQuote && buyToken) {
            const formatted = ethers.formatUnits(selectedQuote.output, buyToken.decimals);
            setToAmount(parseFloat(formatted).toFixed(4));
        }
    }, [selectedQuote, buyToken]); 

    const [swapStatus, setSwapStatus] = useState('idle');

    // ERC20 ABI
    const ERC20_ABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ];

    // --- ROBUST EXECUTION LOGIC ---
    const executeSwap = async () => {
        if (!account) {
            connectWallet();
            return;
        }
        if (!selectedQuote || !signer) return;

        // 1. NETWORK CHECK (Enforce targetChain)
        const currentChainId = Number((await signer.provider.getNetwork()).chainId);
        if (currentChainId !== targetChain) {
            try {
                const hexChain = '0x' + targetChain.toString(16);
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: hexChain }],
                });
                // Wait for switch
                await new Promise(r => setTimeout(r, 1000));
                // Double check
                const newChain = Number((await signer.provider.getNetwork()).chainId);
                if (newChain !== targetChain) return; 
            } catch (e) {
                alert("Please switch network in your wallet manually to " + (targetChain===56?'BSC':(targetChain===137?'Polygon':'Ethereum')));
                return;
            }
        }

        setSwapStatus('initiating');

        try {
            let txParams = {};
            const ONE_INCH_API_KEY = import.meta.env.VITE_1INCH_KEY;
            const ZERO_X_API_KEY = import.meta.env.VITE_0X_KEY;

            // --- 1INCH EXECUTION LOGIC ---
            if (selectedQuote.provider === '1inch') {
                console.log("🚀 Executing 1inch Swap...");
                
                // 1. Get Spender (Router)
                const spenderRes = await fetch(`/api/1inch/swap/v6.0/${targetChain}/approve/spender`, {
                    headers: { 'Authorization': `Bearer ${ONE_INCH_API_KEY}` }
                });
                const spenderData = await spenderRes.json();
                const spender = spenderData.address;

                // 2. Approve Token (If not native)
                const isNative = sellToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
                if (!isNative) {
                    const tokenContract = new ethers.Contract(sellToken.address, ERC20_ABI, signer);
                    const allowance = await tokenContract.allowance(account, spender);
                    const amountWei = ethers.parseUnits(fromAmount, sellToken.decimals);
                    
                    if (allowance < amountWei) {
                        setSwapStatus('approving');
                        console.log("Requesting Approval...");
                        const tx = await tokenContract.approve(spender, amountWei);
                        await tx.wait();
                        console.log("Approved!");
                    }
                }

                // 3. Get Swap Data
                setSwapStatus('swapping');
                const swapUrl = `/api/1inch/swap/v6.0/${targetChain}/swap?src=${sellToken.address}&dst=${buyToken.address}&amount=${ethers.parseUnits(fromAmount, sellToken.decimals).toString()}&from=${account}&slippage=1`;
                const swapRes = await fetch(swapUrl, { headers: { 'Authorization': `Bearer ${ONE_INCH_API_KEY}` } });
                
                if (!swapRes.ok) {
                    const err = await swapRes.json();
                     throw new Error(err.description || "1inch Swap API Failed");
                }
                
                const swapData = await swapRes.json();

                txParams = {
                    to: swapData.tx.to,
                    data: swapData.tx.data,
                    value: swapData.tx.value
                };
            } 
            
            // --- 0X EXECUTION LOGIC ---
            else if (selectedQuote.provider === '0x') {
                console.log("🚀 Executing 0x Swap...");
                setSwapStatus('swapping');
                
                // 0x Quote needs to be re-fetched with takerAddress for valid tx data
                let zeroXBaseUrl = '/api/0x';
                if (targetChain === 137) zeroXBaseUrl = '/api/polygon.0x';
                else if (targetChain === 56) zeroXBaseUrl = '/api/bsc.0x';
                
                // Format symbols for 0x
                const format0x = (addr) => addr.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? (targetChain===56?'BNB':(targetChain===137?'MATIC':'ETH')) : addr;
                
                const zSell = format0x(sellToken.address);
                const zBuy = format0x(buyToken.address);
                const amt = ethers.parseUnits(fromAmount, sellToken.decimals).toString();

                const zUrl = `${zeroXBaseUrl}/swap/v1/quote?sellToken=${zSell}&buyToken=${zBuy}&sellAmount=${amt}&takerAddress=${account}&skipValidation=true`;
                
                const zRes = await fetch(zUrl, { headers: { '0x-api-key': ZERO_X_API_KEY } });
                const zData = await zRes.json();
                
                if (!zRes.ok) throw new Error(zData.reason || "0x Swap Failed");

                // Note: 0x typically handles approval in the `allowanceTarget` field.
                // We should check it if provided.
                if (zData.allowanceTarget) {
                    const isNative = sellToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
                    if (!isNative) {
                         const tokenContract = new ethers.Contract(sellToken.address, ERC20_ABI, signer);
                         const allowance = await tokenContract.allowance(account, zData.allowanceTarget);
                         
                         if (allowance < BigInt(amt)) {
                             setSwapStatus('approving');
                             const tx = await tokenContract.approve(zData.allowanceTarget, BigInt(amt));
                             await tx.wait();
                         }
                    }
                }

                txParams = {
                    to: zData.to,
                    data: zData.data,
                    value: zData.value
                };
            }

            console.log("Sending Transaction...", txParams);
            const tx = await signer.sendTransaction(txParams);
            console.log("Tx Hash:", tx.hash);
            await tx.wait();
            
            setSwapStatus('success');
            alert(`Swap Successful!\nHash: ${tx.hash}`);
            setSwapStatus('idle');
            // Refresh quotes
            handleFetchQuotes();

        } catch (err) {
            console.error(err);
            setSwapStatus('idle');
            alert("Swap Failed: " + (err.message || "Unknown error"));
        }
    };

    if (!sellToken || !buyToken) return <div style={{padding:'2rem', textAlign:'center', color:'white'}}>Loading Tokens...</div>;

    return (
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
            <GlowingCard 
                spread={80} 
                inactiveZone={0.01}
                glowColor="#ff7120"
            >
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', flexDirection:'column', gap:'10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Swap</h2>
                            
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div 
                                    onClick={() => setMockMode(!mockMode)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                        padding: '4px 8px', borderRadius: '6px',
                                        background: mockMode ? 'rgba(255, 165, 0, 0.1)' : 'transparent',
                                        border: `1px solid ${mockMode ? 'rgba(255, 165, 0, 0.3)' : 'transparent'}`,
                                    }}
                                >
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: mockMode ? '#FFA500' : '#444' }}></div>
                                    <span style={{ fontSize: '0.7rem', color: mockMode ? '#FFA500' : '#666' }}>{mockMode ? 'MOCK' : 'LIVE'}</span>
                                </div>
                                <div 
                                    onClick={() => { setAutoRefresh(!autoRefresh); handleFetchQuotes(); }}
                                    style={{ 
                                        width: 24, height: 24, borderRadius: '50%', 
                                        border: `2px solid ${autoRefresh ? 'var(--accent-color)' : '#444'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.6rem', fontWeight: 'bold', color: autoRefresh ? 'var(--accent-color)' : '#666',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {timeLeft}
                                </div>
                            </div>
                        </div>

                         {/* Network Selector */}
                         <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                            {[
                                { id: 1, label: 'ETH' },
                                { id: 56, label: 'BSC' },
                                { id: 137, label: 'POL' }
                            ].map(net => (
                                <button
                                    key={net.id}
                                    onClick={() => setTargetChain(net.id)}
                                    style={{
                                        flex: 1,
                                        background: targetChain === net.id ? 'var(--accent-color)' : 'transparent',
                                        border: 'none', borderRadius: '8px', padding: '8px 12px',
                                        color: targetChain === net.id ? 'white' : '#888',
                                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {net.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* From Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You pay</span>
                             <span>Balance: {sellToken.symbol === 'ETH' || sellToken.symbol === 'BNB' || sellToken.symbol === 'MATIC' ? (account ? balance : '---') : '---'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                                type="number" 
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', width: '60%', outline: 'none', fontFamily: 'var(--font-display)' }} 
                            />
                            <TokenSelector selectedToken={sellToken} onSelect={setSellToken} chainId={targetChain} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-1rem 0', zIndex: 10 }}>
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '0.8rem', padding: '0.5rem' }}><ArrowDown size={20} color="var(--text-muted)" /></div>
                    </div>

                    {/* To Input */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>You receive</span>
                            {selectedQuote && <span style={{color:'#4CAF50', fontSize:'0.8rem'}}>Via {selectedQuote.provider}</span>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {isLoading ? (
                                <div style={{ width: '60%', height: '38px', display: 'flex', alignItems: 'center' }}>
                                    <Loader2 className="animate-spin" color="#ff7120" />
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    value={toAmount}
                                    readOnly
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', width: '60%', outline: 'none', fontFamily: 'var(--font-display)' }} 
                                />
                            )}
                            <TokenSelector selectedToken={buyToken} onSelect={setBuyToken} chainId={targetChain} />
                        </div>
                    </div>

                    {/* Compact Quote List */}
                    {quotes.length > 0 && !isLoading && !error && (
                         <div style={{ marginTop: '0.5rem', display:'flex', flexDirection:'column', gap:'8px' }}>
                             {quotes.map((quote, i) => {
                                 const isSelected = selectedQuote && selectedQuote.provider === quote.provider;
                                 return (
                                    <div 
                                        key={i}
                                        onClick={() => !quote.error && setSelectedQuote(quote)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: isSelected ? 'rgba(255, 113, 32, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                                            cursor: quote.error ? 'default' : 'pointer',
                                            opacity: quote.error ? 0.5 : 1
                                        }}
                                    >
                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                            <span style={{fontWeight:600, fontSize:'0.9rem'}}>{quote.provider}</span>
                                            {quote.isBest && !quote.error && <span style={{fontSize:'0.65rem', background: '#4CAF50', color:'white', padding:'1px 4px', borderRadius:'4px'}}>BEST</span>}
                                            {quote.error && <span style={{fontSize:'0.65rem', background: '#ef4444', color:'white', padding:'1px 4px', borderRadius:'4px'}}>FAIL</span>}
                                        </div>
                                        <div style={{fontWeight:600, fontSize:'0.9rem'}}>
                                            {quote.error ? '---' : `${parseFloat(ethers.formatUnits(quote.output, buyToken.decimals)).toFixed(4)} ${buyToken.symbol}`}
                                        </div>
                                    </div>
                                 )
                             })}
                         </div>
                    )}

                    <button 
                        onClick={executeSwap}
                        disabled={isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)}
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            borderRadius: '1rem',
                            border: 'none',
                            background: (isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)) ? '#333' : 'var(--accent-color)',
                            color: 'white',
                            fontWeight: 700,
                            cursor: (isLoading || swapStatus !== 'idle' || (!selectedQuote && !mockMode)) ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            marginTop: '1rem'
                        }}
                    >
                        {!account ? 'CONNECT WALLET' : 
                            isLoading ? 'FETCHING...' : 
                            !selectedQuote && !mockMode ? 'WAITING FOR QUOTE...' :
                            swapStatus === 'idle' ? 'SWAP NOW' : 
                            swapStatus.toUpperCase() + '...'}
                    </button>

                </div>
            </GlowingCard>
        </div>
    );
};

export default SwapCard;
