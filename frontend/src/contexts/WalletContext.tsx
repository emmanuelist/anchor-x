import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  WalletState, 
  initialWalletState, 
  connectedWalletState,
  mockTransactions,
  Transaction,
} from '@/lib/mockData';
import { toast } from 'sonner';

interface WalletContextType {
  wallet: WalletState;
  transactions: Transaction[];
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateBalance: (chain: 'ethereum' | 'stacks', amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setWallet(connectedWalletState);
    setIsConnecting(false);
    toast.success('Wallet connected successfully', {
      description: 'You can now start bridging assets',
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(initialWalletState);
    toast.info('Wallet disconnected');
  }, []);

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

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        isConnecting,
        connectWallet,
        disconnectWallet,
        addTransaction,
        updateBalance,
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
