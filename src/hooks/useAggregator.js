import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useAggregator = () => {
    const [quotes, setQuotes] = useState([]);
    const [bestQuote, setBestQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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
        slippage = 0.005 
    }) => {
        if (!amount || parseFloat(amount) === 0) return;
        
        setIsLoading(true);
        setError(null);
        setQuotes([]);
        setBestQuote(null);

        try {
            const params = new URLSearchParams({
                fromChain: fromChain || 1, 
                toChain: toChain || 1,     
                fromToken: normalizeToken(sellToken),
                toToken: normalizeToken(buyToken),
                fromAmount: amount, 
                fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
                slippage: slippage,
                allowBridges: 'true', 
                allowExchanges: 'true'
            });

            const response = await fetch(`/api/lifi/quote?${params.toString()}`);
            
            if (!response.ok) {
                const errText = await response.text();
                try {
                    const errJson = JSON.parse(errText);
                    throw new Error(errJson.message || 'Route unavailable');
                } catch (e) {
                    throw new Error('Failed to fetch quote');
                }
            }

            const data = await response.json();
            
            if (!data.transactionRequest) {
                throw new Error("No transaction route found");
            }

            const quote = {
                provider: data.toolDetails?.name || 'Aggregator',
                logo: data.toolDetails?.logoURI,
                output: data.estimate.toAmount,
                outputDecimals: data.action.toToken.decimals,
                gasCostUsd: data.estimate.gasCosts?.[0]?.amountUSD || 0,
                netValueUsd: parseFloat(data.estimate.toAmountUSD || 0),
                transactionRequest: data.transactionRequest, 
                approvalAddress: data.estimate.approvalAddress,
                isBest: true
            };

            setQuotes([quote]);
            setBestQuote(quote);

        } catch (err) {
            setError(err.message || "Failed to find routes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { getQuotes, bestQuote, quotes, isLoading, error };
};
