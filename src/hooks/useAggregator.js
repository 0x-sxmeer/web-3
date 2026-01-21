import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useAggregator = () => {
    const [quotes, setQuotes] = useState([]);
    const [bestQuote, setBestQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper: LI.FI expects 0x000... for native ETH, but 1inch returns 0xeee...
    const normalizeToken = (address) => {
        if (!address) return '0x0000000000000000000000000000000000000000';
        if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            return '0x0000000000000000000000000000000000000000';
        }
        return address;
    };

    const getQuotes = useCallback(async ({ 
        sellToken, 
        buyToken, 
        amount, 
        userAddress, 
        fromChain, 
        toChain,
        slippage = 0.005 // 0.5% default
    }) => {
        if (!amount || parseFloat(amount) === 0) return;
        
        setIsLoading(true);
        setError(null);
        setQuotes([]);
        setBestQuote(null);

        try {
            // Jumper/LI.FI Quote Endpoint
            const params = new URLSearchParams({
                fromChain: fromChain || 1, 
                toChain: toChain || 1,     
                fromToken: normalizeToken(sellToken), // <--- FIX APPLIED HERE
                toToken: normalizeToken(buyToken),    // <--- FIX APPLIED HERE
                fromAmount: amount, 
                fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
                slippage: slippage,
                allowBridges: 'true', 
                allowExchanges: 'true'
            });

            console.log("⚡ Fetching LI.FI Quotes:", params.toString());

            const response = await fetch(`/api/lifi/quote?${params.toString()}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch quotes');
            }

            const data = await response.json();
            
            const quote = {
                provider: data.toolDetails?.name || 'Aggregator',
                logo: data.toolDetails?.logoURI,
                output: data.estimate.toAmount,
                outputDecimals: data.action.toToken.decimals,
                gasCostUsd: data.estimate.gasCosts?.[0]?.amountUSD || 0,
                netValueUsd: parseFloat(data.estimate.toAmountUSD || 0),
                transactionRequest: data.transactionRequest, 
                approvalAddress: data.estimate.approvalAddress,
                isBest: true,
                raw: data 
            };

            setQuotes([quote]);
            setBestQuote(quote);

        } catch (err) {
            console.error("❌ Aggregator Error:", err);
            setError(err.message || "Failed to find routes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { getQuotes, bestQuote, quotes, isLoading, error };
};
