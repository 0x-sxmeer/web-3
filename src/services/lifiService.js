// src/services/lifiService.js

const cache = {
    chains: null,
    tokens: {}
};

const API_URL = 'https://li.quest/v1';
const API_KEY = import.meta.env.VITE_LIFI_API_KEY;

const getHeaders = () => ({
    'accept': 'application/json',
    'x-lifi-api-key': API_KEY
});

export const LiFiService = {
    // 1. Fetch all supported chains
    getChains: async () => {
        if (cache.chains) return cache.chains;

        try {
            const response = await fetch(`${API_URL}/chains`, { headers: getHeaders() });
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
            const response = await fetch(`${API_URL}/tokens?chains=${chainId}`, { headers: getHeaders() });
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

    // 3. Fetch Tools (Bridges & Exchanges)
    getTools: async () => {
        if (cache.tools) return cache.tools;

        try {
            const response = await fetch(`${API_URL}/tools`, { headers: getHeaders() });
            if (!response.ok) throw new Error('Failed to fetch tools');
            
            const data = await response.json();
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
            const response = await fetch(`${API_URL}/advanced/stepTransaction`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getHeaders()
                },
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
