// src/services/tokenService.js
import { TOKENS } from './web3Service';

// Cache the list in memory to avoid re-fetching every time the user opens the menu
let tokenCache = {
    1: [], // Mainnet
    11155111: [] // Sepolia
};

export const fetchOneInchTokens = async (chainId) => {
    // 1. Return cached if available
    if (tokenCache[chainId] && tokenCache[chainId].length > 0) {
        console.log(`📦 Using cached tokens for chain ${chainId} (${tokenCache[chainId].length} tokens)`);
        return tokenCache[chainId];
    }

    try {
        const ONE_INCH_API_KEY = import.meta.env.VITE_1INCH_KEY;
        if (!ONE_INCH_API_KEY) throw new Error("Missing 1inch API Key");

        console.log(`🔍 Fetching tokens from 1inch for chain ${chainId}...`);

        // 2. Fetch from 1inch API (using your Vite proxy)
        const response = await fetch(`/api/1inch/swap/v6.0/${chainId}/tokens`, {
            headers: {
                'Authorization': `Bearer ${ONE_INCH_API_KEY}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("1inch tokens API error:", response.status, errorText);
            throw new Error("Failed to fetch tokens");
        }

        const data = await response.json();
        
        // 3. Transform Object to Array
        // 1inch returns { "0x...": { symbol: "ETH", ... } }
        const tokenArray = Object.values(data.tokens).map(t => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            decimals: t.decimals,
            logo: t.logoURI
        }));

        console.log(`✅ Fetched ${tokenArray.length} tokens from 1inch`);

        // 4. Sort: Put Native ETH and USDC at the top
        tokenArray.sort((a, b) => {
            if (a.symbol === 'ETH') return -1;
            if (b.symbol === 'ETH') return 1;
            if (a.symbol === 'USDC') return -1;
            if (b.symbol === 'USDC') return 1;
            return 0; // Keep original order for others
        });

        // Save to cache
        tokenCache[chainId] = tokenArray;
        return tokenArray;

    } catch (error) {
        console.error("Token Fetch Error:", error);
        return []; // Return empty on failure so UI doesn't crash
    }
};
