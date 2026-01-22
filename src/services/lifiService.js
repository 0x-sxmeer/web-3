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
            return [];
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
    },

    // 3. Fetch Tools (Bridges & Exchanges) [NEW]
    getTools: async () => {
        if (cache.tools) return cache.tools;

        try {
            const response = await fetch('/api/lifi/tools');
            if (!response.ok) throw new Error('Failed to fetch tools');
            
            const data = await response.json();
            // LI.FI returns { bridges: [...], exchanges: [...] }
            const tools = {
                bridges: data.bridges || [],
                exchanges: data.exchanges || []
            };

            cache.tools = tools;
            return tools;
        } catch (error) {
            console.error("Tools Fetch Error:", error);
            return { bridges: [], exchanges: [] };
        }
    },

    // 4. Fetch Transaction Data for a Step
    getStepTransaction: async (step) => {
        try {
            const response = await fetch('/api/lifi/advanced/stepTransaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(step)
            });

            if (!response.ok) {
                 const errText = await response.text();
                 throw new Error(`Failed to fetch step transaction: ${errText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Step Transaction Fetch Error:", error);
            throw error;
        }
    }
};
