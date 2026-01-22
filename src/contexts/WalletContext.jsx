import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [isConnecting, setIsConnecting] = useState(false);

  // Helper to find the best wallet provider (OKX or MetaMask)
  const getWalletProvider = () => {
    if (typeof window === 'undefined') return null;
    return window.okxwallet || window.ethereum;
  };

  const updateBalance = async (userAddress, userProvider) => {
    if (userAddress && userProvider) {
      try {
        const bal = await userProvider.getBalance(userAddress);
        const balEth = ethers.formatEther(bal);
        setBalance(parseFloat(balEth).toFixed(4));
      } catch (e) {
        console.error("Failed to fetch balance", e);
        setBalance('0.00');
      }
    } else {
        setBalance('0.00');
    }
  };

  // Reusable initialization logic
  const initWalletState = async (walletSource) => {
      if (!walletSource) return;

      const _provider = new ethers.BrowserProvider(walletSource);
      setProvider(_provider);

      try {
        const accounts = await _provider.listAccounts();
        
        if (accounts.length > 0) {
            const _signer = await _provider.getSigner();
            setSigner(_signer);
            const _account = await _signer.getAddress();
            setAccount(_account); // Use address string directly
            
            const network = await _provider.getNetwork();
            setChainId(Number(network.chainId));
            
            // Fetch initial balance
            await updateBalance(_account, _provider);
        }
      } catch (e) {
        console.log("Wallet not connected on init", e);
      }
  };

  // 1. Auto-connect on mount
  useEffect(() => {
        let mounted = true;
        
        const setup = async () => {
            const walletSource = getWalletProvider();
            
            if (walletSource) {
                // Event Handlers
                const handleAccountsChanged = async (accounts) => {
                    if (!mounted) return;
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                        // Re-fetch signer for new account
                        const _provider = new ethers.BrowserProvider(walletSource);
                        const _signer = await _provider.getSigner();
                        if (mounted) {
                            setProvider(_provider);
                            setSigner(_signer);
                            updateBalance(accounts[0], _provider);
                        }
                    } else {
                        setAccount(null);
                        setSigner(null);
                        setBalance('0.00');
                    }
                };

                const handleChainChanged = async (chainIdHex) => {
                    if (!mounted) return;
                    // Reload is recommended by MetaMask/Ethers, but we can hot-update
                    window.location.reload(); 
                };

                // Attach Listeners
                walletSource.on('accountsChanged', handleAccountsChanged);
                walletSource.on('chainChanged', handleChainChanged);

                // Initial Init
                await initWalletState(walletSource);

                return () => {
                    mounted = false;
                    walletSource.removeListener('accountsChanged', handleAccountsChanged);
                    walletSource.removeListener('chainChanged', handleChainChanged);
                };
            }
        };

        setup();
    }, []);


  // 2. Manual Connect
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const walletSource = getWalletProvider();

      if (!walletSource) {
        alert("Please install OKX Wallet or MetaMask!");
        return;
      }

      await walletSource.request({ method: 'eth_requestAccounts' });
      await initWalletState(walletSource);
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setBalance('0.00');
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    networkName: chainId === 1 ? 'Ethereum' : chainId === 11155111 ? 'Sepolia' : 'Unknown',
    balance,       
    updateBalance, 
    isConnecting,
    connectWallet,
    disconnectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
