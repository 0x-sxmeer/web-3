// src/services/tokenService.js

// Cache to prevent spamming the API
let tokenCache = {};

export const fetchLifiTokens = async (chainId) => {
    // 1. Return cached if available
    if (tokenCache[chainId] && tokenCache[chainId].length > 0) {
        return tokenCache[chainId];
    }

    try {
        console.log(`🔍 Fetching LI.FI tokens for chain ${chainId}...`);

        // Fetch from your local proxy which points to https://li.quest/v1/tokens
        const response = await fetch('/api/lifi/tokens', {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch token list");
        }

        const data = await response.json();
        
        // LI.FI returns structure: { tokens: { 1: [...], 137: [...] } }
        // We extract the array for the specific chain requested
        const chainTokens = data.tokens[chainId] || [];

        // Transform into your app's format
        const tokenArray = chainTokens.map(t => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address, // LI.FI uses 0x0000... for native ETH correctly
            decimals: t.decimals,
            logo: t.logoURI,
            priceUSD: t.priceUSD // LI.FI often gives price data too
        }));

        console.log(`✅ Fetched ${tokenArray.length} tokens from LI.FI`);

        // Sort: Native Token (ETH) first, then USDC, then others
        tokenArray.sort((a, b) => {
            const isNativeA = a.address === '0x0000000000000000000000000000000000000000';
            const isNativeB = b.address === '0x0000000000000000000000000000000000000000';
            if (isNativeA) return -1;
            if (isNativeB) return 1;
            if (a.symbol === 'USDC') return -1;
            if (b.symbol === 'USDC') return 1;
            return 0; 
        });

        // Save to cache
        tokenCache[chainId] = tokenArray;
        return tokenArray;

    } catch (error) {
        console.error("Token Fetch Error:", error);
        return []; 
    }
};
