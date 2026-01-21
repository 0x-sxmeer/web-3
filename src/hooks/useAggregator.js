import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useAggregator = () => {
    const [bestQuote, setBestQuote] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGasPrice = async () => {
        try { return ethers.parseUnits("3", "gwei"); } 
        catch (e) { return ethers.parseUnits("3", "gwei"); }
    };

    const calculateNetValue = (amountOut, gasLimit, gasPriceWei, tokenPriceUsd, ethPriceUsd, decimals) => {
        if (!amountOut || !gasLimit) return { netValueUsd: 0, gasCostUsd: 0, outputUsd: 0 };
        const outputEther = parseFloat(ethers.formatUnits(amountOut, decimals));
        // Simple logic for demo: assume stablecoin output $1, gas cost irrelevant for selection sorting
        return { netValueUsd: outputEther, gasCostUsd: 0, outputUsd: outputEther };
    };

    // FIX 1: Handle BNB symbol for BSC
    const formatTokenFor0x = (tokenAddress, chainId) => {
        if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            if (chainId === 56) return 'BNB';
            if (chainId === 137) return 'MATIC';
            return 'ETH';
        }
        return tokenAddress;
    };

    const getQuotes = useCallback(async ({ 
        sellToken, 
        buyToken, 
        amount, 
        userAddress, 
        slippage = 1, 
        buyTokenDecimals = 18,
        chainId = 1 
    }) => {
        if (!amount || parseFloat(amount) === 0) return;
        
        setIsLoading(true);
        setError(null);
        setBestQuote(null);
        setQuotes([]);

        try {
            const ZERO_X_API_KEY = import.meta.env.VITE_0X_KEY;
            const ONE_INCH_API_KEY = import.meta.env.VITE_1INCH_KEY;
            const currentGasPriceWei = await fetchGasPrice();

            // --- 0X API ---
            let zeroXBaseUrl = '/api/0x';
            if (chainId === 137) zeroXBaseUrl = '/api/polygon.0x';
            else if (chainId === 56) zeroXBaseUrl = '/api/bsc.0x';

            const zeroXSellToken = formatTokenFor0x(sellToken, chainId);
            const zeroXBuyToken = formatTokenFor0x(buyToken, chainId);
            
            // FIX 2: Remove takerAddress to prevent validation errors
            const zeroXUrl = `${zeroXBaseUrl}/swap/v1/quote?sellToken=${zeroXSellToken}&buyToken=${zeroXBuyToken}&sellAmount=${amount}&skipValidation=true`;
            
            const zeroXPromise = fetch(zeroXUrl, {
                headers: { '0x-api-key': ZERO_X_API_KEY }
            }).then(async r => {
                if (!r.ok) {
                    const t = await r.text();
                    try { throw new Error(JSON.parse(t).reason); } catch(e) { throw new Error(`HTTP ${r.status}`); }
                }
                return r.json();
            });

            // --- 1INCH API ---
            // FIX 3: Use /quote instead of /swap for price check
            const oneInchUrl = `/api/1inch/swap/v6.0/${chainId}/quote?src=${sellToken}&dst=${buyToken}&amount=${amount}`;
            
            const oneInchPromise = fetch(oneInchUrl, {
                headers: { 'Authorization': `Bearer ${ONE_INCH_API_KEY}` }
            }).then(async r => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.description || '1inch Error');
                return data;
            });

            const [res0x, res1inch] = await Promise.allSettled([zeroXPromise, oneInchPromise]);

            let results = [];

            // Process 0x
            if (res0x.status === 'fulfilled') {
                const data = res0x.value;
                const { netValueUsd } = calculateNetValue(data.buyAmount, data.estimatedGas || 200000, currentGasPriceWei, 1, 2500, buyTokenDecimals);
                results.push({ 
                    provider: '0x', 
                    output: data.buyAmount, 
                    data: data,
                    netValueUsd 
                });
            } else {
                console.warn("0x failed:", res0x.reason);
                results.push({ provider: '0x', error: "Failed", netValueUsd: -1, output: "0" });
            }

            // Process 1inch
            if (res1inch.status === 'fulfilled') {
                const data = res1inch.value;
                const { netValueUsd } = calculateNetValue(data.dstAmount, data.gas || 200000, currentGasPriceWei, 1, 2500, buyTokenDecimals);
                results.push({ 
                    provider: '1inch', 
                    output: data.dstAmount, 
                    data: data, // Note: This is quote data, not swap data
                    netValueUsd 
                });
            } else {
                console.warn("1inch failed:", res1inch.reason);
                 results.push({ provider: '1inch', error: "Failed", netValueUsd: -1, output: "0" });
            }

            if (results.length === 0) {
                setError("No quotes available");
                setIsLoading(false);
                return;
            }

            results.sort((a, b) => b.netValueUsd - a.netValueUsd);
            const best = { ...results[0], isBest: true };
            results = results.map((r, i) => i === 0 ? best : { ...r, isBest: false });

            setQuotes(results);
            setBestQuote(best);

        } catch (err) {
            console.error("Aggregator Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { getQuotes, bestQuote, quotes, isLoading, error };
};
