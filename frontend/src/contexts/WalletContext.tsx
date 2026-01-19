import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { 
  WalletState, 
  initialWalletState, 
  Transaction,
} from '@/lib/data';
import { toast } from 'sonner';

// Import real wallet services
import { 
  connectStacksWallet, 
  disconnectStacksWallet,
  fetchUSDCxBalance,
  fetchSTXBalance,
  isStacksWalletConnected,
  getConnectedStacksAddress,
} from '@/lib/stacks/wallet';

import {
  connectEthereumWallet,
  disconnectEthereumWallet,
  fetchUSDCBalance,
  fetchETHBalance,
  isEthereumWalletConnected,
  getConnectedEthereumAddress,
  connectSpecificWallet,
} from '@/lib/ethereum/wallet';

// AppKit hooks for Ethereum wallet state
import { useAppKitAccount, useDisconnect } from '@reown/appkit/react';

import { getBridgeTransactions, syncTransactionStatuses, backfillGasFees, type BridgeTransaction } from '@/lib/bridge';
import type { NetworkEnvironment } from '@/lib/constants/contracts';

interface WalletContextType {
  wallet: WalletState;
  transactions: Transaction[];
  isConnecting: boolean;
  network: NetworkEnvironment;
  connectWallet: () => Promise<void>;
  connectStacksOnly: () => Promise<void>;
  connectEthereumOnly: () => Promise<void>;
  connectEthereumWithWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateBalance: (chain: 'ethereum' | 'stacks', amount: number) => void;
  refreshBalances: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network] = useState<NetworkEnvironment>('testnet');

  // AppKit state - syncs with wagmi/appkit for Ethereum
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();
  const { disconnect: disconnectAppKit } = useDisconnect();

  // Use ref to access current wallet state without causing dependency changes
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  // Track previous AppKit address to prevent unnecessary updates
  const prevAppKitAddressRef = useRef<string | undefined>(undefined);

  // Sync AppKit Ethereum connection with our wallet state
  useEffect(() => {
    // Skip if address hasn't actually changed
    if (prevAppKitAddressRef.current === appKitAddress) {
      return;
    }
    const wasConnected = !!prevAppKitAddressRef.current;
    prevAppKitAddressRef.current = appKitAddress;

    if (appKitConnected && appKitAddress) {
      console.log('AppKit connected:', appKitAddress);
      
      // Update wallet state with AppKit address
      setWallet(prev => {
        // Only update if address changed
        if (prev.ethereumAddress === appKitAddress) return prev;
        return {
          ...prev,
          isConnected: true,
          ethereumAddress: appKitAddress,
        };
      });

      // Fetch USDC balance and show toast
      fetchUSDCBalance(appKitAddress, network)
        .then(balance => {
          const formatted = Number(balance) / 1_000_000;
          setWallet(prev => ({
            ...prev,
            usdcBalance: formatted,
          }));
          console.log('USDC balance:', formatted);
          
          // Show success toast with balance (only for new connections)
          if (!wasConnected) {
            const shortAddress = `${appKitAddress.slice(0, 6)}...${appKitAddress.slice(-4)}`;
            toast.success('Ethereum wallet connected', {
              description: `${shortAddress} • $${formatted.toFixed(2)} USDC`,
              icon: '🔷',
            });
          }
        })
        .catch(err => console.error('Failed to fetch USDC balance:', err));
    } else if (!appKitConnected && walletRef.current.ethereumAddress && !walletRef.current.stacksAddress) {
      // AppKit disconnected and no Stacks - reset
      setWallet(initialWalletState);
    } else if (!appKitConnected && walletRef.current.ethereumAddress) {
      // AppKit disconnected but Stacks still connected - just clear ETH
      setWallet(prev => ({
        ...prev,
        ethereumAddress: null,
        usdcBalance: 0,
        isConnected: !!prev.stacksAddress,
      }));
    }
  }, [appKitConnected, appKitAddress, network]);

  // Helper function to convert BridgeTransaction to Transaction format
  const convertBridgeTransactions = (bridgeTxs: BridgeTransaction[]): Transaction[] => {
    return bridgeTxs.map(tx => ({
      id: tx.id,
      type: tx.direction as 'deposit' | 'withdraw',
      amount: parseFloat(tx.amount),
      status: tx.status === 'processing' ? 'confirming' : tx.status,
      fromChain: tx.direction === 'deposit' ? 'ethereum' : 'stacks',
      toChain: tx.direction === 'deposit' ? 'stacks' : 'ethereum',
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      txHash: tx.txHash,
      destinationTxHash: tx.destinationTxHash,
      timestamp: new Date(tx.timestamp),
      confirmations: tx.status === 'completed' ? 12 : 0,
      requiredConfirmations: tx.direction === 'deposit' ? 12 : 6,
      fee: parseFloat(tx.amount) * 0.0025,
      // Use real gas fee from transaction if available, otherwise use fallback estimate
      gasFee: tx.gasFeeUsd ?? (tx.direction === 'deposit' ? 5.50 : 0.10),
    }));
  };

  // Load transactions from local storage on mount and sync statuses
  useEffect(() => {
    let isMounted = true;
    let hasBackfilled = false;
    
    const loadAndSyncTransactions = async () => {
      // First load from localStorage
      const bridgeTxs = getBridgeTransactions();
      if (isMounted) {
        setTransactions(convertBridgeTransactions(bridgeTxs));
      }
      
      // Backfill gas fees for transactions that don't have them (async, non-blocking)
      // Only do this once per mount
      if (!hasBackfilled) {
        hasBackfilled = true;
        backfillGasFees().then(() => {
          if (isMounted) {
            // Reload transactions after backfill
            const updatedTxs = getBridgeTransactions();
            setTransactions(convertBridgeTransactions(updatedTxs));
          }
        }).catch(err => {
          console.warn('Could not backfill gas fees:', err);
        });
      }
      
      // Then sync statuses with blockchain (async)
      try {
        const syncedTxs = await syncTransactionStatuses();
        if (isMounted) {
          setTransactions(convertBridgeTransactions(syncedTxs));
        }
      } catch (error) {
        console.error('Error syncing transaction statuses:', error);
      }
    };
    
    loadAndSyncTransactions();
    
    // Check existing wallet connections
    checkExistingConnections();
    
    // Set up periodic sync every 30 seconds for pending transactions
    const syncInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const syncedTxs = await syncTransactionStatuses();
        if (isMounted) {
          setTransactions(convertBridgeTransactions(syncedTxs));
        }
      } catch (error) {
        console.error('Error syncing transaction statuses:', error);
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  const checkExistingConnections = async () => {
    try {
      let newWalletState = { ...initialWalletState };
      let hasConnection = false;

      // Check Stacks wallet
      if (isStacksWalletConnected()) {
        const stacksAddress = getConnectedStacksAddress();
        if (stacksAddress) {
          newWalletState.stacksAddress = stacksAddress;
          hasConnection = true;
          
          // Fetch USDCx balance
          try {
            const usdcxBalance = await fetchUSDCxBalance(stacksAddress, network);
            newWalletState.usdcxBalance = Number(usdcxBalance) / 1_000_000;
          } catch (e) {
            console.error('Failed to fetch USDCx balance:', e);
          }
        }
      }

      // Check Ethereum wallet
      if (isEthereumWalletConnected()) {
        const ethAddress = await getConnectedEthereumAddress();
        if (ethAddress) {
          newWalletState.ethereumAddress = ethAddress;
          hasConnection = true;
          
          // Fetch USDC balance
          try {
            const usdcBalance = await fetchUSDCBalance(ethAddress, network);
            newWalletState.usdcBalance = Number(usdcBalance) / 1_000_000;
          } catch (e) {
            console.error('Failed to fetch USDC balance:', e);
          }
        }
      }

      if (hasConnection) {
        newWalletState.isConnected = true;
        setWallet(newWalletState);
      }
    } catch (err) {
      console.error('Error checking existing connections:', err);
    }
  };

  const connectWallet = useCallback(async () => {
    // Real wallet connection - connect both wallets
    setIsConnecting(true);
    
    try {
      // Connect Stacks first
      console.log('Connecting Stacks wallet...');
      const stacksResult = await connectStacksWallet();
      const stacksAddress = stacksResult.address;
      console.log('Stacks wallet connected:', stacksAddress);

      // Then connect Ethereum
      console.log('Connecting Ethereum wallet...');
      const ethereumAddress = await connectEthereumWallet(network);
      console.log('Ethereum wallet connected:', ethereumAddress);

      // Fetch balances with logging
      console.log('Fetching balances...');
      const [usdcBalance, usdcxBalance] = await Promise.all([
        fetchUSDCBalance(ethereumAddress, network).catch((e) => {
          console.error('USDC balance fetch error:', e);
          return BigInt(0);
        }),
        fetchUSDCxBalance(stacksAddress, network).catch((e) => {
          console.error('USDCx balance fetch error:', e);
          return BigInt(0);
        }),
      ]);

      console.log('Raw balances:', { usdcBalance, usdcxBalance });
      
      const usdcFormatted = Number(usdcBalance) / 1_000_000;
      const usdcxFormatted = Number(usdcxBalance) / 1_000_000;
      
      console.log('Formatted balances:', { usdcFormatted, usdcxFormatted });

      setWallet({
        isConnected: true,
        ethereumAddress,
        stacksAddress,
        usdcBalance: usdcFormatted,
        usdcxBalance: usdcxFormatted,
      });

      toast.success('Both wallets connected! 🎉', {
        description: `ETH: $${usdcFormatted.toFixed(2)} USDC • STX: $${usdcxFormatted.toFixed(2)} USDCx`,
      });
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast.error('Connection failed', {
        description: error.message || 'Failed to connect wallets',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [network]);

  const connectStacksOnly = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      const stacksResult = await connectStacksWallet();
      const stacksAddress = stacksResult.address;

      const usdcxBalance = await fetchUSDCxBalance(stacksAddress, network).catch(() => BigInt(0));
      const usdcxFormatted = Number(usdcxBalance) / 1_000_000;

      setWallet(prev => ({
        ...prev,
        isConnected: true,
        stacksAddress,
        usdcxBalance: usdcxFormatted,
      }));

      const shortAddress = `${stacksAddress.slice(0, 6)}...${stacksAddress.slice(-4)}`;
      toast.success('Stacks wallet connected', {
        description: `${shortAddress} • $${usdcxFormatted.toFixed(2)} USDCx`,
        icon: '🟠',
      });
    } catch (error: any) {
      toast.error('Connection failed', {
        description: error.message || 'Failed to connect Stacks wallet',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [network]);

  const connectEthereumOnly = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      const ethereumAddress = await connectEthereumWallet(network);
      const usdcBalance = await fetchUSDCBalance(ethereumAddress, network).catch(() => BigInt(0));

      setWallet(prev => ({
        ...prev,
        isConnected: true,
        ethereumAddress,
        usdcBalance: Number(usdcBalance) / 1_000_000,
      }));

      toast.success('Ethereum wallet connected', {
        description: `Address: ${ethereumAddress.slice(0, 8)}...${ethereumAddress.slice(-6)}`,
      });
    } catch (error: any) {
      toast.error('Connection failed', {
        description: error.message || 'Failed to connect Ethereum wallet',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [network]);

  const connectEthereumWithWallet = useCallback(async (walletId: string) => {
    setIsConnecting(true);
    
    try {
      const ethereumAddress = await connectSpecificWallet(walletId, network);

      // Update wallet state immediately for fast UX
      setWallet(prev => ({
        ...prev,
        isConnected: true,
        ethereumAddress,
      }));

      const walletNames: Record<string, string> = {
        metamask: 'MetaMask',
        coinbase: 'Coinbase Wallet',
        okx: 'OKX Wallet',
        trust: 'Trust Wallet',
        rabby: 'Rabby Wallet',
        brave: 'Brave Wallet',
      };

      toast.success(`${walletNames[walletId] || 'Wallet'} connected`, {
        description: `Address: ${ethereumAddress.slice(0, 8)}...${ethereumAddress.slice(-6)}`,
      });

      // Fetch balance in background (don't block the connection)
      fetchUSDCBalance(ethereumAddress, network)
        .then(usdcBalance => {
          setWallet(prev => ({
            ...prev,
            usdcBalance: Number(usdcBalance) / 1_000_000,
          }));
        })
        .catch(console.error);
        
    } catch (error: any) {
      toast.error('Connection failed', {
        description: error.message || 'Failed to connect wallet',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [network]);

  const refreshBalances = useCallback(async () => {
    const currentWallet = walletRef.current;
    if (!currentWallet.isConnected) return;

    console.log('Refreshing balances...');
    
    try {
      const updates: Partial<WalletState> = {};

      if (currentWallet.ethereumAddress) {
        console.log(`Fetching USDC balance for ${currentWallet.ethereumAddress}`);
        const usdcBalance = await fetchUSDCBalance(currentWallet.ethereumAddress as `0x${string}`, network);
        updates.usdcBalance = Number(usdcBalance) / 1_000_000;
        console.log(`USDC balance: ${updates.usdcBalance}`);
      }

      if (currentWallet.stacksAddress) {
        console.log(`Fetching USDCx balance for ${currentWallet.stacksAddress}`);
        const usdcxBalance = await fetchUSDCxBalance(currentWallet.stacksAddress, network);
        updates.usdcxBalance = Number(usdcxBalance) / 1_000_000;
        console.log(`USDCx balance: ${updates.usdcxBalance}`);
      }

      setWallet(prev => ({ ...prev, ...updates }));
      console.log('Balances refreshed:', updates);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }, [network]);

  const disconnectWallet = useCallback(() => {
    // Disconnect from AppKit (Ethereum)
    disconnectAppKit();
    // Disconnect from Stacks
    disconnectStacksWallet();
    // Also disconnect old Ethereum method
    disconnectEthereumWallet();
    setWallet(initialWalletState);
    toast.info('Wallet disconnected');
  }, [disconnectAppKit]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      timestamp: new Date(),
    };
    setTransactions(prev => [newTx, ...prev]);
  }, []);

  const updateBalance = useCallback((chain: 'ethereum' | 'stacks', amount: number) => {
    setWallet(prev => ({
      ...prev,
      usdcBalance: chain === 'ethereum' ? prev.usdcBalance + amount : prev.usdcBalance,
      usdcxBalance: chain === 'stacks' ? prev.usdcxBalance + amount : prev.usdcxBalance,
    }));
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      // First reload from localStorage (in case new txs were added by syncFromBlockchain)
      const bridgeTxs = getBridgeTransactions();
      setTransactions(convertBridgeTransactions(bridgeTxs));
      
      // Then sync statuses with blockchain
      const syncedTxs = await syncTransactionStatuses();
      setTransactions(convertBridgeTransactions(syncedTxs));
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  }, []);

  // Auto-refresh balances every 30 seconds when connected
  useEffect(() => {
    if (!wallet.isConnected) return;

    // Refresh immediately when connected
    refreshBalances();

    const interval = setInterval(refreshBalances, 30000);
    return () => clearInterval(interval);
    // Only depend on isConnected to avoid re-triggering on every balance update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.isConnected]);

  // Refresh balances when page becomes visible (user switches back to tab)
  useEffect(() => {
    if (!wallet.isConnected) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page visible - refreshing balances...');
        refreshBalances();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // Only depend on isConnected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.isConnected]);

  // Listen for Ethereum account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet(prev => ({
          ...prev,
          ethereumAddress: null,
          usdcBalance: 0,
          isConnected: !!prev.stacksAddress,
        }));
      } else {
        const newAddress = accounts[0] as `0x${string}`;
        const usdcBalance = await fetchUSDCBalance(newAddress, network).catch(() => BigInt(0));
        setWallet(prev => ({
          ...prev,
          ethereumAddress: newAddress,
          usdcBalance: Number(usdcBalance) / 1_000_000,
        }));
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [network]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        isConnecting,
        network,
        connectWallet,
        connectStacksOnly,
        connectEthereumOnly,
        connectEthereumWithWallet,
        disconnectWallet,
        addTransaction,
        updateBalance,
        refreshBalances,
        refreshTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
