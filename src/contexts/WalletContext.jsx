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
    initProvider();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Re-init signer/provider/balance
          const _provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(_provider);
          const _signer = await _provider.getSigner();
          setSigner(_signer);
          
          const network = await _provider.getNetwork();
          setChainId(network.chainId);

          await updateBalance(accounts[0], _provider);

        } else {
          setAccount(null);
          setSigner(null);
          setBalance('0.00');
        }
      });

      window.ethereum.on('chainChanged', async (chainId) => {
        // Update state directly without reloading
        const _provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(_provider);
        
        try {
            const _signer = await _provider.getSigner();
            setSigner(_signer);
            
            const network = await _provider.getNetwork();
            setChainId(network.chainId);
            
            if (account) {
                updateBalance(account, _provider);
            }
        } catch (error) {
            console.error("Failed to update wallet state on chain change:", error);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
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
