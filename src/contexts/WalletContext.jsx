import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
        }
      } catch (e) {
        console.log("Wallet not connected on init");
      }
    }
  };

  useEffect(() => {
    initProvider();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          initProvider(); // Re-init signer/provider
        } else {
          setAccount(null);
          setSigner(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
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
    // Note: You can't programmatically disconnect MetaMask, but we clear local state
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
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
