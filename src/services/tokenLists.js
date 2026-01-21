// Token lists for different networks
export const NETWORK_CONFIGS = {
    1: { // Ethereum Mainnet
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrl: 'https://rpc.ankr.com/eth',
        blockExplorer: 'https://etherscan.io'
    },
    11155111: { // Sepolia Testnet
        name: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrl: 'https://rpc.sepolia.org',
        blockExplorer: 'https://sepolia.etherscan.io'
    }
};

// Mainnet tokens
export const MAINNET_TOKENS = [
    {
        symbol: 'ETH',
        name: 'Ether',
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Special address for native ETH
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        isNative: true
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
    }
];

// Sepolia testnet tokens
export const SEPOLIA_TOKENS = [
    {
        symbol: 'ETH',
        name: 'Sepolia Ether',
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        isNative: true,
        faucet: 'https://sepoliafaucet.com'
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia WETH
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
    },
    {
        symbol: 'USDC',
        name: 'USD Coin (Test)',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
        decimals: 6,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin (Test)',
        address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // Sepolia DAI
        decimals: 18,
        logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
    }
];

// Get tokens for a specific network
export const getTokensForNetwork = (chainId) => {
    switch (chainId) {
        case 1:
            return MAINNET_TOKENS;
        case 11155111:
            return SEPOLIA_TOKENS;
        default:
            return MAINNET_TOKENS; // Default to mainnet
    }
};

// Get network config
export const getNetworkConfig = (chainId) => {
    return NETWORK_CONFIGS[chainId] || NETWORK_CONFIGS[1];
};
