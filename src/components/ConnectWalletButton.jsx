import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ConnectWalletButton = () => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      setIsConnecting(true);
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsHovered(false);
  };

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <button 
      onClick={account ? disconnectWallet : connectWallet}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
          background: account ? (isHovered ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 113, 32, 0.1)') : 'var(--accent-color)', // Red tint on hover if connected
          border: account ? (isHovered ? '1px solid #ff3b30' : '1px solid var(--accent-color)') : 'none',
          padding: '0.9rem 2rem',
          color: account ? (isHovered ? '#ff3b30' : 'var(--accent-color)') : 'white',
          fontWeight: 600,
          fontSize: '0.9rem',
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          transition: 'all 0.2s',
          letterSpacing: '0.02em',
          cursor: 'pointer',
          minWidth: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)'
      }}
    >
      {isConnecting ? 'CONNECTING...' : account ? (isHovered ? 'DISCONNECT' : formatAddress(account)) : 'CONNECT WALLET'}
    </button>
  );
};

export default ConnectWalletButton;
