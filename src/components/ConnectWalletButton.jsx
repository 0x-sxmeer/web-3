import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const ConnectWalletButton = () => {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [isHovered, setIsHovered] = useState(false);

  const handleDisconnect = (e) => {
      e.stopPropagation();
      disconnectWallet();
      setIsHovered(false);
  };

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <button 
      onClick={account ? handleDisconnect : connectWallet}
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
