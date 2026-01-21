// src/services/lifiService.js

const cache = {
    chains: null,
    tokens: {}
};

export const LiFiService = {
    // 1. Fetch all supported chains (Ethereum, Arbitrum, Base, Solana, etc.)
    getChains: async () => {
        if (cache.chains) return cache.chains;

        try {
            const response = await fetch('/api/lifi/chains');
            if (!response.ok) throw new Error('Failed to fetch chains');
            
            const data = await response.json();
            const chains = data.chains || [];
            
            cache.chains = chains;
            return chains;
        } catch (error) {
            console.error("Chain Fetch Error:", error);
            // Fallback to basic chains if API fails
            return [
                { id: 1, name: 'Ethereum', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg' },
                { id: 137, name: 'Polygon', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/polygon.svg' },
                { id: 42161, name: 'Arbitrum', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg' },
                { id: 10, name: 'Optimism', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/optimism.svg' },
                { id: 8453, name: 'Base', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/base.svg' },
                { id: 1151111081099710, name: 'Solana', logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/solana.svg' }
            ];
        }
    },

    // 2. Fetch all tokens for a chain
    getTokens: async (chainId) => {
        if (cache.tokens[chainId]) return cache.tokens[chainId];

        try {
            const response = await fetch(`/api/lifi/tokens?chains=${chainId}`);
            if (!response.ok) throw new Error('Failed to fetch tokens');

            const data = await response.json();
            const tokens = data.tokens[chainId] || [];

            // Sort by price/priority
            tokens.sort((a, b) => {
                if (a.priceUSD && !b.priceUSD) return -1;
                if (!a.priceUSD && b.priceUSD) return 1;
                return 0;
            });

            cache.tokens[chainId] = tokens;
            return tokens;
        } catch (error) {
            console.error("Token Fetch Error:", error);
            return [];
        }
    }
};
