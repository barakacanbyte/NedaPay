import React from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Chip, 
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

const WalletConnect: React.FC = () => {
  const { 
    isInitialized, 
    isConnecting, 
    account, 
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
    error
  } = useWeb3();

  // Format account address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle connect wallet button click
  const handleConnectWallet = async () => {
    await connectWallet();
  };

  // Handle switch network button click
  const handleSwitchNetwork = async () => {
    await switchNetwork();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {isInitialized && account ? (
        <>
          {!isCorrectNetwork ? (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={handleSwitchNetwork}
              startIcon={<WarningIcon />}
            >
              Switch Network
            </Button>
          ) : (
            <Tooltip title="Connected to Base network">
              <Chip
                icon={<CheckIcon />}
                label="Base"
                color="success"
                size="small"
                sx={{ mr: 1 }}
              />
            </Tooltip>
          )}
          
          <Tooltip title={account}>
            <Chip
              icon={<WalletIcon />}
              label={formatAddress(account)}
              color="primary"
              variant="outlined"
            />
          </Tooltip>
        </>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={handleConnectWallet}
          startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <WalletIcon />}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
      
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default WalletConnect;
