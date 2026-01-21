import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useAggregator = () => {
    const [quotes, setQuotes] = useState([]);
    const [bestQuote, setBestQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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
                fromChain: fromChain || 1, // Default Ethereum
                toChain: toChain || 1,     // Default Ethereum
                fromToken: sellToken,
                toToken: buyToken,
                fromAmount: amount, // Must be in WEI
                fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
                slippage: slippage,
                allowBridges: 'true', 
                allowExchanges: 'true'
            });

            console.log("⚡ Fetching Jumper/LI.FI Quotes...");

            const response = await fetch(`/api/lifi/quote?${params.toString()}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch quotes');
            }

            const data = await response.json();
            
            // Normalize LI.FI response
            const quote = {
                provider: data.toolDetails?.name || 'Aggregator',
                logo: data.toolDetails?.logoURI,
                output: data.estimate.toAmount,
                outputDecimals: data.action.toToken.decimals,
                gasCostUsd: data.estimate.gasCosts?.[0]?.amountUSD || 0,
                netValueUsd: parseFloat(data.estimate.toAmountUSD || 0),
                // CRITICAL: The exact transaction object for execution
                transactionRequest: data.transactionRequest, 
                // CRITICAL: Who we need to approve (Spender)
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
