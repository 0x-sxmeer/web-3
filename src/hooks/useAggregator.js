import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useAggregator = () => {
    const [routes, setRoutes] = useState([]); // Store ALL routes
    const [activeRoute, setActiveRoute] = useState(null); // The selected route
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const normalizeToken = (address) => {
        if (!address) return '0x0000000000000000000000000000000000000000';
        if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            return '0x0000000000000000000000000000000000000000';
        }
        return address;
    };

    const getRoutes = useCallback(async ({ 
        sellToken, buyToken, amount, userAddress, fromChain, toChain, slippage = 0.005 
    }) => {
        if (!amount || parseFloat(amount) === 0) return;
        
        setIsLoading(true);
        setError(null);
        setRoutes([]);
        setActiveRoute(null);

        try {
            // Construct payload for POST request
            const payload = {
                fromChainId: fromChain || 1, 
                toChainId: toChain || 1,     
                fromTokenAddress: normalizeToken(sellToken),
                toTokenAddress: normalizeToken(buyToken),
                fromAmount: amount, 
                // Use a dummy non-zero address if not connected, as some providers fail with 0x0
                fromAddress: userAddress || '0x5555555555555555555555555555555555555555',
                options: { 
                    slippage: slippage,
                    order: 'RECOMMENDED'
                }
            };

            console.log("Fetching Routes Payload:", JSON.stringify(payload));

            // Use /advanced/routes which is the robust POST endpoint
            const getResponse = await fetch('/api/lifi/advanced/routes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!getResponse.ok) {
                const text = await getResponse.text();
                console.error("API Error Response:", text);
                try {
                    const json = JSON.parse(text);
                    // Code 1003 usually means specific route issues (like min amount)
                    throw new Error(json.message || `No routes found (Code: ${json.code})`);
                } catch (e) { throw new Error(e.message || text || "API Error"); }
            }

            const data = await getResponse.json();
            const validRoutes = data.routes || [];

            if (validRoutes.length === 0) throw new Error("No routes found");

            // Process routes to add friendly tags
            const processedRoutes = validRoutes.map((route, index) => {
                const step = route.steps[0];
                return {
                    id: route.id,
                    provider: step.toolDetails?.name || step.tool,
                    logo: step.toolDetails?.logoURI,
                    output: route.toAmount,
                    outputDecimals: data.toToken?.decimals || 18, // Sometimes at root
                    gasCostUsd: route.gasCostUSD,
                    netValueUsd: route.toAmountUSD,
                    steps: route.steps,
                    tags: index === 0 ? ['BEST'] : [], // First one is usually best
                    raw: route
                };
            });

            setRoutes(processedRoutes);
            setActiveRoute(processedRoutes[0]); // Default to best

        } catch (err) {
            setError(err.message || "Failed to find routes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { getRoutes, routes, activeRoute, setActiveRoute, isLoading, error };
};
