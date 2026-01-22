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

  const initProvider = async () => {
    if (window.ethereum) {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(_provider);
      
      try {
        // Check if already authorized WITHOUT prompting
        const accounts = await _provider.listAccounts();
        
        if (accounts.length > 0) {
            const _signer = await _provider.getSigner();
            setSigner(_signer);
            const _account = await _signer.getAddress();
            setAccount(_account);
            const network = await _provider.getNetwork();
            setChainId(network.chainId);
            
            // Fetch initial balance
            await updateBalance(_account, _provider);
        }
      } catch (e) {
        console.log("Wallet not connected on init");
      }
    }
  };
  useEffect(() => {
        const initProvider = async () => {
            if (window.ethereum) {
                const _provider = new ethers.BrowserProvider(window.ethereum);
                setProvider(_provider);
                
                // --- Event Handlers ---
                const handleAccountsChanged = async (accounts) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                        // Re-fetch signer for new account
                        const _signer = await _provider.getSigner();
                        setSigner(_signer);
                        updateBalance(accounts[0], _provider);
                    } else {
                        setAccount(null);
                        setSigner(null);
                        setBalance(null);
                    }
                };

                const handleChainChanged = async (chainIdHex) => {
                    const id = parseInt(chainIdHex, 16);
                    setChainId(id);
                    
                    // Hot-Update Provider & Signer instead of reloading
                    const _provider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(_provider);
                    
                    try {
                        const _signer = await _provider.getSigner();
                        setSigner(_signer);
                        const _address = await _signer.getAddress();
                        setAccount(_address);
                        updateBalance(_address, _provider);
                    } catch (e) {
                         console.error("Failed to update wallet state after chain switch", e);
                    }
                };

                // Attach Listeners
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);

                // Initial Check
                try {
                    const accounts = await _provider.listAccounts();
                    if (accounts.length > 0) {
                         const currentAccount = accounts[0].address;
                         setAccount(currentAccount);
                         const _signer = await _provider.getSigner();
                         setSigner(_signer);
                         updateBalance(currentAccount, _provider);
                    }
                    const network = await _provider.getNetwork();
                    setChainId(Number(network.chainId));
                } catch (e) {
                    console.error("Initialization Error:", e);
                }

                // Cleanup
                return () => {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                };
            }

        };

        initProvider();
    }, []);


  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await initProvider();
      
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
    // Note: You can't programmatically disconnect MetaMask, but we clear local state
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    networkName: chainId === 1n ? 'Ethereum' : chainId === 11155111n ? 'Sepolia' : 'Unknown',
    balance,       // Exported
    updateBalance, // Exported
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
