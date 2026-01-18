/**
 * Real Wallet Context
 * 
 * Provides unified wallet state for both Stacks and Ethereum wallets
 * with real blockchain integrations
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect,
  ReactNode 
} from 'react';
import { toast } from 'sonner';

// Import wallet services
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
} from '@/lib/ethereum/wallet';

import type { NetworkEnvironment } from '@/lib/constants/contracts';
import { 
  getBridgeTransactions, 
  type BridgeTransaction 
} from '@/lib/bridge';

// ============ Types ============

export interface WalletBalances {
  /** USDC balance on Ethereum (in micro units) */
  usdc: bigint;
  /** USDCx balance on Stacks (in micro units) */
  usdcx: bigint;
  /** ETH balance (in wei) */
  eth: bigint;
  /** STX balance (in micro-STX) */
  stx: bigint;
}

export interface WalletState {
  /** Whether any wallet is connected */
  isConnected: boolean;
  /** Whether Stacks wallet is connected */
  isStacksConnected: boolean;
  /** Whether Ethereum wallet is connected */
  isEthereumConnected: boolean;
  /** Stacks wallet address */
  stacksAddress: string | null;
  /** Ethereum wallet address */
  ethereumAddress: `0x${string}` | null;
  /** User balances */
  balances: WalletBalances;
  /** Current network environment */
  network: NetworkEnvironment;
}

export interface WalletContextType {
  wallet: WalletState;
  transactions: BridgeTransaction[];
  isConnecting: boolean;
  isLoadingBalances: boolean;
  error: string | null;
  
  // Connection methods
  connectStacks: () => Promise<void>;
  connectEthereum: () => Promise<void>;
  connectBothWallets: () => Promise<void>;
  disconnectStacks: () => void;
  disconnectEthereum: () => void;
  disconnectAll: () => void;
  
  // Balance methods
  refreshBalances: () => Promise<void>;
  
  // Network methods
  setNetwork: (network: NetworkEnvironment) => void;
  
  // Transaction methods
  addTransaction: (tx: BridgeTransaction) => void;
  updateTransaction: (id: string, updates: Partial<BridgeTransaction>) => void;
  refreshTransactions: () => void;
}

// ============ Initial State ============

const initialBalances: WalletBalances = {
  usdc: BigInt(0),
  usdcx: BigInt(0),
  eth: BigInt(0),
  stx: BigInt(0),
};

const initialWalletState: WalletState = {
  isConnected: false,
  isStacksConnected: false,
  isEthereumConnected: false,
  stacksAddress: null,
  ethereumAddress: null,
  balances: initialBalances,
  network: 'testnet',
};

// ============ Context ============

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ============ Provider ============

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('anchorx_network') as NetworkEnvironment;
    if (savedNetwork) {
      setWallet(prev => ({ ...prev, network: savedNetwork }));
    }
    
    // Load transactions
    setTransactions(getBridgeTransactions());
    
    // Check for existing wallet connections
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      // Check Stacks
      if (isStacksWalletConnected()) {
        const stacksAddress = getConnectedStacksAddress();
        if (stacksAddress) {
          setWallet(prev => ({
            ...prev,
            isStacksConnected: true,
            isConnected: true,
            stacksAddress,
          }));
        }
      }

      // Check Ethereum
      if (isEthereumWalletConnected()) {
        const address = await getConnectedEthereumAddress();
        if (address) {
          setWallet(prev => ({
            ...prev,
            isEthereumConnected: true,
            isConnected: true,
            ethereumAddress: address,
          }));
        }
      }
    } catch (err) {
      console.error('Error checking existing connections:', err);
    }
  };

  // ============ Connection Methods ============

  const connectStacks = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const result = await connectStacksWallet();
      const stacksAddress = result.address;

      setWallet(prev => ({
        ...prev,
        isStacksConnected: true,
        isConnected: true,
        stacksAddress,
      }));

      toast.success('Stacks wallet connected', {
        description: `Address: ${stacksAddress.slice(0, 8)}...${stacksAddress.slice(-6)}`,
      });

      // Fetch balances after connection
      await fetchStacksBalances(stacksAddress);
    } catch (err: any) {
      const message = err.message || 'Failed to connect Stacks wallet';
      setError(message);
      toast.error('Connection failed', { description: message });
    } finally {
      setIsConnecting(false);
    }
  }, [wallet.network]);

  const connectEthereum = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const address = await connectEthereumWallet(wallet.network);

      setWallet(prev => ({
        ...prev,
        isEthereumConnected: true,
        isConnected: true,
        ethereumAddress: address,
      }));

      toast.success('Ethereum wallet connected', {
        description: `Address: ${address.slice(0, 8)}...${address.slice(-6)}`,
      });

      // Fetch balances after connection
      await fetchEthereumBalances(address);
    } catch (err: any) {
      const message = err.message || 'Failed to connect Ethereum wallet';
      setError(message);
      toast.error('Connection failed', { description: message });
    } finally {
      setIsConnecting(false);
    }
  }, [wallet.network]);

  const connectBothWallets = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Connect Stacks first
      const stacksResult = await connectStacksWallet();
      const stacksAddress = stacksResult.address;

      // Then connect Ethereum
      const ethereumAddress = await connectEthereumWallet(wallet.network);

      setWallet(prev => ({
        ...prev,
        isStacksConnected: true,
        isEthereumConnected: true,
        isConnected: true,
        stacksAddress,
        ethereumAddress,
      }));

      toast.success('Both wallets connected', {
        description: 'You can now bridge assets between chains',
      });

      // Fetch all balances
      await Promise.all([
        fetchStacksBalances(stacksAddress),
        fetchEthereumBalances(ethereumAddress),
      ]);
    } catch (err: any) {
      const message = err.message || 'Failed to connect wallets';
      setError(message);
      toast.error('Connection failed', { description: message });
    } finally {
      setIsConnecting(false);
    }
  }, [wallet.network]);

  const disconnectStacks = useCallback(() => {
    disconnectStacksWallet();
    setWallet(prev => ({
      ...prev,
      isStacksConnected: false,
      isConnected: prev.isEthereumConnected,
      stacksAddress: null,
      balances: {
        ...prev.balances,
        usdcx: BigInt(0),
        stx: BigInt(0),
      },
    }));
    toast.info('Stacks wallet disconnected');
  }, []);

  const disconnectEthereum = useCallback(() => {
    disconnectEthereumWallet();
    setWallet(prev => ({
      ...prev,
      isEthereumConnected: false,
      isConnected: prev.isStacksConnected,
      ethereumAddress: null,
      balances: {
        ...prev.balances,
        usdc: BigInt(0),
        eth: BigInt(0),
      },
    }));
    toast.info('Ethereum wallet disconnected');
  }, []);

  const disconnectAll = useCallback(() => {
    disconnectStacksWallet();
    disconnectEthereumWallet();
    setWallet({
      ...initialWalletState,
      network: wallet.network,
    });
    toast.info('All wallets disconnected');
  }, [wallet.network]);

  // ============ Balance Methods ============

  const fetchStacksBalances = async (address: string) => {
    try {
      const [usdcx, stx] = await Promise.all([
        fetchUSDCxBalance(address, wallet.network),
        fetchSTXBalance(address, wallet.network),
      ]);
      
      setWallet(prev => ({
        ...prev,
        balances: {
          ...prev.balances,
          usdcx,
          stx,
        },
      }));
    } catch (err) {
      console.error('Error fetching Stacks balances:', err);
    }
  };

  const fetchEthereumBalances = async (address: `0x${string}`) => {
    try {
      const [usdc, eth] = await Promise.all([
        fetchUSDCBalance(address, wallet.network),
        fetchETHBalance(address, wallet.network),
      ]);
      
      setWallet(prev => ({
        ...prev,
        balances: {
          ...prev.balances,
          usdc,
          eth,
        },
      }));
    } catch (err) {
      console.error('Error fetching Ethereum balances:', err);
    }
  };

  const refreshBalances = useCallback(async () => {
    setIsLoadingBalances(true);
    
    try {
      const promises: Promise<void>[] = [];
      
      if (wallet.stacksAddress) {
        promises.push(fetchStacksBalances(wallet.stacksAddress));
      }
      
      if (wallet.ethereumAddress) {
        promises.push(fetchEthereumBalances(wallet.ethereumAddress));
      }
      
      await Promise.all(promises);
    } catch (err) {
      console.error('Error refreshing balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [wallet.stacksAddress, wallet.ethereumAddress, wallet.network]);

  // ============ Network Methods ============

  const setNetwork = useCallback((network: NetworkEnvironment) => {
    localStorage.setItem('anchorx_network', network);
    setWallet(prev => ({
      ...prev,
      network,
    }));
    
    // Refresh balances for new network
    setTimeout(() => refreshBalances(), 100);
  }, [refreshBalances]);

  // ============ Transaction Methods ============

  const addTransaction = useCallback((tx: BridgeTransaction) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<BridgeTransaction>) => {
    setTransactions(prev => 
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    );
  }, []);

  const refreshTransactions = useCallback(() => {
    setTransactions(getBridgeTransactions());
  }, []);

  // ============ Auto-refresh balances ============

  useEffect(() => {
    if (!wallet.isConnected) return;

    // Refresh balances every 30 seconds
    const interval = setInterval(refreshBalances, 30000);
    
    return () => clearInterval(interval);
  }, [wallet.isConnected, refreshBalances]);

  // ============ Listen for account changes ============

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectEthereum();
      } else {
        setWallet(prev => ({
          ...prev,
          ethereumAddress: accounts[0] as `0x${string}`,
        }));
        refreshBalances();
      }
    };

    const handleChainChanged = () => {
      // Reload the page on chain change as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectEthereum, refreshBalances]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        isConnecting,
        isLoadingBalances,
        error,
        connectStacks,
        connectEthereum,
        connectBothWallets,
        disconnectStacks,
        disconnectEthereum,
        disconnectAll,
        refreshBalances,
        setNetwork,
        addTransaction,
        updateTransaction,
        refreshTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ============ Hook ============

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// ============ Utility Hooks ============

/**
 * Hook to get formatted balance strings
 */
export function useFormattedBalances() {
  const { wallet } = useWallet();
  
  return {
    usdc: formatBalance(wallet.balances.usdc, 6),
    usdcx: formatBalance(wallet.balances.usdcx, 6),
    eth: formatBalance(wallet.balances.eth, 18),
    stx: formatBalance(wallet.balances.stx, 6),
  };
}

function formatBalance(value: bigint, decimals: number): string {
  const num = Number(value) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Hook to check if user can bridge
 */
export function useCanBridge() {
  const { wallet } = useWallet();
  
  return {
    canDeposit: wallet.isEthereumConnected && wallet.isStacksConnected && wallet.balances.usdc > 0n,
    canWithdraw: wallet.isStacksConnected && wallet.isEthereumConnected && wallet.balances.usdcx > 0n,
    needsStacksWallet: !wallet.isStacksConnected,
    needsEthereumWallet: !wallet.isEthereumConnected,
  };
}
