import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useAggregator = () => {
    const [bestQuote, setBestQuote] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Mock prices for demo purposes
    // IN A REAL APP: Fetch these from a price API (like CoinGecko or Oracle)
    const ETH_PRICE_USD = 2500;
    const USDC_PRICE_USD = 1.0;

    const fetchGasPrice = async () => {
        try {
            // If connected to a real provider, we could use:
            // const provider = new ethers.BrowserProvider(window.ethereum);
            // const feeData = await provider.getFeeData();
            // return feeData.gasPrice;
            
            // For this demo/race, we'll assume a standard gas price if we can't fetch it
            // 20 Gwei
            return ethers.parseUnits("20", "gwei");
        } catch (e) {
            return ethers.parseUnits("20", "gwei");
        }
    };

    const calculateNetValue = (amountOut, gasLimit, gasPriceWei, tokenPriceUsd, ethPriceUsd, decimals) => {
        if (!amountOut || !gasLimit) return { netValueUsd: 0, gasCostUsd: 0, outputUsd: 0 };

        // 1. Calculate Gross Output in USD
        // amountOut is usually BigInt or string of base units
        const outputEther = parseFloat(ethers.formatUnits(amountOut, decimals));
        const outputUsd = outputEther * tokenPriceUsd;

        // 2. Calculate Gas Cost in USD
        // Gas Cost = GasLimit * GasPrice
        const gasCostWei = BigInt(gasLimit) * BigInt(gasPriceWei);
        const gasCostEther = parseFloat(ethers.formatEther(gasCostWei));
        const gasCostUsd = gasCostEther * ethPriceUsd;

        // 3. Net Value
        const netValueUsd = outputUsd - gasCostUsd;

        return {
            netValueUsd,
            gasCostUsd,
            outputUsd
        };
    };

    // HELPER FUNCTION: Fixes the 0x address issue
    const formatTokenFor0x = (tokenAddress) => {
        // 0x API expects "ETH" string for native token, not 0xeeee... address
        if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
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
        chainId = 1 // Default to Ethereum Mainnet
    }) => {
        console.log("getQuotes INVOKED", { sellToken, buyToken, amount, chainId });
        if (!amount || parseFloat(amount) === 0) return;
        
        setIsLoading(true);
        setError(null);
        setBestQuote(null);
        setQuotes([]);

        try {
            // 0x API Key
            const ZERO_X_API_KEY = import.meta.env.VITE_0X_KEY;
            // 1inch API Key
            const ONE_INCH_API_KEY = import.meta.env.VITE_1INCH_KEY;

            // Parallel requests + Gas Price
            const isMockAddress = !userAddress || userAddress.includes('123') || userAddress.length < 42 || userAddress === '0x0000000000000000000000000000000000000000';
            // 0x rejects zero address as takerAddress
            const zeroXTakerAddress = isMockAddress ? undefined : userAddress;
            // 1inch requires a 'from' address
            const oneInchFromAddress = userAddress || '0x0000000000000000000000000000000000000000';

            console.log("API Keys Check:", {
                ZeroX: ZERO_X_API_KEY ? `Present (${ZERO_X_API_KEY.length} chars)` : 'MISSING',
                OneInch: ONE_INCH_API_KEY ? `Present (${ONE_INCH_API_KEY.length} chars)` : 'MISSING',
                ChainId: chainId
            });

            // We need gas price for the race formula
            const currentGasPriceWei = await fetchGasPrice();

            // 0x API - Dynamic chain support
            // 0x uses different subdomains for different chains
            // Mainnet (1): api.0x.org, Polygon (137): polygon.api.0x.org, BSC (56): bsc.api.0x.org
            let zeroXBaseUrl = '/api/0x';
            if (chainId === 137) {
                zeroXBaseUrl = '/api/polygon.0x';
            } else if (chainId === 56) {
                zeroXBaseUrl = '/api/bsc.0x';
            }
            // For testnets or unsupported chains, 0x might not work - we'll let it fail gracefully
            
            // CRITICAL FIX: Convert 0xeeee... to 'ETH' for 0x API
            const zeroXSellToken = formatTokenFor0x(sellToken);
            const zeroXBuyToken = formatTokenFor0x(buyToken);
            
            const zeroXUrl = `${zeroXBaseUrl}/swap/v1/quote?sellToken=${zeroXSellToken}&buyToken=${zeroXBuyToken}&sellAmount=${amount}${zeroXTakerAddress ? `&takerAddress=${zeroXTakerAddress}` : ''}&skipValidation=true`;
            console.log("0x Requesting:", zeroXUrl);

            const zeroXPromise = fetch(zeroXUrl, {
                headers: { '0x-api-key': ZERO_X_API_KEY }
            }).then(async r => {
                if (!r.ok) {
                    const errText = await r.text();
                    console.error("0x Raw Error:", r.status, errText);
                    let errJson;
                    try {
                        errJson = JSON.parse(errText);
                    } catch (e) {
                        // ignore json parse error
                    }
                    
                    const errorMsg = errJson?.reason || errJson?.message || `HTTP ${r.status}`;
                    throw new Error(errorMsg);
                }
                return r.json();
            });

            // 1inch API - Dynamic chain support
            // 1inch uses chainId directly in the URL path
            const oneInchUrl = `/api/1inch/swap/v6.0/${chainId}/swap?src=${sellToken}&dst=${buyToken}&amount=${amount}&from=${oneInchFromAddress}&slippage=${slippage}&disableEstimate=true`;
            console.log("1inch Requesting:", oneInchUrl);

            const oneInchPromise = fetch(oneInchUrl, {
                headers: { 'Authorization': `Bearer ${ONE_INCH_API_KEY}` }
            }).then(async r => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.description || '1inch Error');
                return data;
            });

            const [res0x, res1inch] = await Promise.allSettled([
                zeroXPromise,
                oneInchPromise
            ]);

            let results = [];

            // Helper to process 0x result
            if (res0x.status === 'fulfilled') {
                const data = res0x.value;
                
                const { netValueUsd, gasCostUsd, outputUsd } = calculateNetValue(
                    data.buyAmount, 
                    data.estimatedGas || 200000, 
                    currentGasPriceWei, 
                    USDC_PRICE_USD, 
                    ETH_PRICE_USD,
                    buyTokenDecimals 
                );

                results.push({
                    provider: '0x',
                    output: data.buyAmount,
                    gas: data.estimatedGas,
                    netValueUsd,
                    gasCostUsd,
                    outputUsd,
                    data: data
                });
            } else {
                console.warn("0x failed:", res0x.reason);
                results.push({
                    provider: '0x',
                    error: res0x.reason?.message || "Connection Failed",
                    netValueUsd: -999999, // Ensure it sorts last
                    output: "0",
                    gas: 0
                });
            }

            // Helper to process 1inch result
            if (res1inch.status === 'fulfilled') {
                const data = res1inch.value;
                
                const gasEst = data.tx?.gas || 200000;
                
                const { netValueUsd, gasCostUsd, outputUsd } = calculateNetValue(
                    data.dstAmount, 
                    gasEst, 
                    currentGasPriceWei, 
                    USDC_PRICE_USD, 
                    ETH_PRICE_USD,
                    buyTokenDecimals 
                );

                results.push({
                    provider: '1inch',
                    output: data.dstAmount,
                    gas: gasEst,
                    netValueUsd,
                    gasCostUsd,
                    outputUsd,
                    data: data
                });
            } else {
                console.warn("1inch failed:", res1inch.reason);
                 results.push({
                    provider: '1inch',
                    error: res1inch.reason?.message || "Connection Failed",
                    netValueUsd: -999999,
                    output: "0",
                    gas: 0
                });
            }

            if (results.length === 0) {
                setError("No quotes available");
                setIsLoading(false);
                return;
            }

            // CRITICAL STRATEGY: Sort by Net Value, not just Output
            results.sort((a, b) => b.netValueUsd - a.netValueUsd);

            // Mark best
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
