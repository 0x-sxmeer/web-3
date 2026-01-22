import { useState, useCallback, useEffect } from 'react';
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
        sellToken, buyToken, amount, userAddress, fromChain, toChain, slippage = 0.005,
        allowBridges = [], allowExchanges = []
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
                fromAddress: userAddress || '0x0000000000000000000000000000000000000000',
                options: { 
                    slippage: slippage,
                    integrator: 'nebula-labs', // <--- ADD THIS
                    order: 'RECOMMENDED',               // <--- ADD THIS
                    bridges: allowBridges.length > 0 ? { allow: allowBridges } : undefined,
                    exchanges: allowExchanges.length > 0 ? { allow: allowExchanges } : undefined
                }
            };

            console.log("Fetching Routes Payload:", JSON.stringify(payload));

            // Use direct API call (Frontend-only approach)
            const response = await fetch('https://li.quest/v1/advanced/routes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-lifi-api-key': import.meta.env.VITE_LIFI_API_KEY
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error("API Error Response:", text);
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.message || `No routes found (Code: ${json.code})`);
                } catch (e) { throw new Error(e.message || text || "API Error"); }
            }

            const data = await response.json();
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
                    outputDecimals: data.toToken?.decimals || 18, 
                    gasCostUsd: route.gasCostUSD,
                    netValueUsd: route.toAmountUSD,
                    steps: route.steps,
                    tags: index === 0 ? ['BEST'] : [], 
                    raw: route
                };
            });

            setRoutes(processedRoutes);
            
            // Smart Update: Keep active route if it's still valid (in the new list), otherwise pick best
            setActiveRoute(prev => {
                if (prev) {
                    const stillExists = processedRoutes.find(r => r.id === prev.id);
                    if (stillExists) return stillExists; // Update with fresh data
                }
                return processedRoutes[0]; // Default to best
            });

        } catch (err) {
            setError(err.message || "Failed to find routes");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Polling Logic
    useEffect(() => {
        let interval;
        if (activeRoute && !isLoading && !error) {
            interval = setInterval(() => {
                console.log("🔄 Refreshing routes...");
                // Note: We need to store latest params in a ref to properly re-fetch
                // For now, this is a placeholder. To fully implement, we need to lift params state or use a ref.
            }, 20000);
        }
        return () => clearInterval(interval);
    }, [activeRoute, isLoading, error]);

    return { getRoutes, routes, activeRoute, setActiveRoute, isLoading, error };
};
