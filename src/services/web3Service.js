import { ethers } from 'ethers';

// --- CONSTANTS (Ethereum Mainnet) ---
export const TOKENS = {
    WETH: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        symbol: 'ETH' // For native ETH we wrap seamlessly or use Router's logic
    },
    USDC: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        symbol: 'USDC'
    },
    CGPT: {
        address: '0x9840652DC04fb9db2C43853633f0F62BE6f00f98', // ChainGPT Token
        decimals: 18,
        symbol: 'CGPT'
    }
};

// Uniswap V3 SwapRouter02
const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
// Uniswap V3 QuoterV2
const QUOTER_ADDRESS = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e';

// Minimal ABIs
const QUOTER_ABI = [
    "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)"
];

const ROUTER_ABI = [
    "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

// Fee Tier (0.3% is standard for most pairs like ETH/USDC)
const FEE_TIER = 3000; 

const FALLBACK_RPC = "https://rpc.ankr.com/eth"; // Reliable public RPC

export const Web3Service = {
    // 1. Get Quote (READ ONLY)
    // Uses a dedicated RPC Provider or the injected one
    getQuote: async (amountIn, tokenInSymbol, tokenOutSymbol, userProvider) => {
        if (!amountIn || parseFloat(amountIn) === 0) return '0';
        
        try {
            // Priority: User's provider (if connected to Mainnet) -> Fallback RPC
            let provider = userProvider;
            
            // Check if userProvider is valid and on Mainnet (chainId 1)
            // If not, default to Fallback
            if (!provider) {
                 provider = new ethers.JsonRpcProvider(FALLBACK_RPC);
            } else {
                try {
                    const network = await provider.getNetwork();
                    if (Number(network.chainId) !== 1) {
                        // User is on wrong network, use Falback for reading data
                         provider = new ethers.JsonRpcProvider(FALLBACK_RPC);
                    }
                } catch (e) {
                     provider = new ethers.JsonRpcProvider(FALLBACK_RPC);
                }
            }

            const quoterContract = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
            
            const tokenIn = TOKENS[tokenInSymbol === 'ETH' ? 'WETH' : tokenInSymbol];
            const tokenOut = TOKENS[tokenOutSymbol === 'ETH' ? 'WETH' : tokenOutSymbol];

            const parsedAmount = ethers.parseUnits(amountIn.toString(), tokenIn.decimals);

            // Using quoteExactInputSingle
            // Struct: { tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 }
            const params = {
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                fee: FEE_TIER,
                amountIn: parsedAmount,
                sqrtPriceLimitX96: 0
            };

            // Call static to simulate transaction without sending
            const result = await quoterContract.quoteExactInputSingle.staticCall(params);
            const amountOut = result.amountOut;

            return ethers.formatUnits(amountOut, tokenOut.decimals);

        } catch (error) {
            console.error("Quote Error:", error);
            // Fallback for simulation if RPC fails or no provider
            return null;
        }
    },

    // 2. Execute Swap (WRITE)
    swap: async (amountIn, tokenInSymbol, tokenOutSymbol, signer) => {
        if (!signer) throw new Error("Wallet not connected");

        const routerContract = new ethers.Contract(SWAP_ROUTER_ADDRESS, ROUTER_ABI, signer);
        
        // Handle ETH specifically - using WETH address but sending value
        const isNativeEth = tokenInSymbol === 'ETH';
        const tokenIn = TOKENS[isNativeEth ? 'WETH' : tokenInSymbol];
        const tokenOut = TOKENS[tokenOutSymbol];

        const parsedAmount = ethers.parseUnits(amountIn.toString(), tokenIn.decimals);
        const address = await signer.getAddress();

        // Warning: For non-ETH tokens, we need APPROVAL first. 
        // For this demo, assuming ETH -> Token (payable) is simpler as it doesn't need approval for ETH.
        // If Token -> ETH, we'd check allowance.

        const params = {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            fee: FEE_TIER,
            recipient: address,
            amountIn: parsedAmount,
            amountOutMinimum: 0, // In prod, calculate slippage!
            sqrtPriceLimitX96: 0
        };

        const tx = await routerContract.exactInputSingle(params, {
            value: isNativeEth ? parsedAmount : 0 // Send ETH if input is native
        });

        return tx;
    }
};
