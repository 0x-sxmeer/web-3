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
            // Docs: https://apidocs.li.fi/reference/get_quote
            const params = new URLSearchParams({
                fromChain: fromChain || 1, // Default Ethereum
                toChain: toChain || 1,     // Default Ethereum (Same chain swap)
                fromToken: sellToken,
                toToken: buyToken,
                fromAmount: amount, // Must be in WEI (raw units)
                fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
                slippage: slippage,
                // We ask for multiple bridges/exchanges to compare
                allowBridges: 'true', 
                allowExchanges: 'true'
            });

            console.log("⚡ Fetching Jumper/LI.FI Quotes:", params.toString());

            const response = await fetch(`/api/lifi/quote?${params.toString()}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch quotes');
            }

            const data = await response.json();
            
            // Normalize LI.FI response to your UI structure
            // LI.FI returns a single "best" route in /quote, but we can treat it as our primary
            // To get a comparison list like Jumper, you would typically use /routes endpoint
            // For now, we wrap the result in an array to match your UI
            
            const quote = {
                provider: data.toolDetails?.name || 'Aggregator',
                logo: data.toolDetails?.logoURI,
                output: data.estimate.toAmount,
                outputDecimals: data.action.toToken.decimals,
                gasCostUsd: data.estimate.gasCosts?.[0]?.amountUSD || 0,
                netValueUsd: parseFloat(data.estimate.toAmountUSD || 0),
                // CRITICAL: The transaction object for execution
                transactionRequest: data.transactionRequest, 
                // CRITICAL: Approval data
                approvalAddress: data.estimate.approvalAddress,
                isBest: true,
                raw: data // Keep raw data for debugging
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
