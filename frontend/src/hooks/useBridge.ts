/**
 * Bridge Hook
 * 
 * React hook for bridge operations (deposit and withdraw)
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/RealWalletContext';
import { 
  executeDeposit, 
  executeWithdraw,
  needsApproval,
  estimateDepositGas,
  validateWithdrawAmount,
  generateTxId,
  saveBridgeTransaction,
  type DepositProgress,
  type WithdrawProgress,
  type BridgeTransaction,
  type BridgeDirection,
} from '@/lib/bridge';
import { toast } from 'sonner';

// ============ Types ============

export interface UseBridgeReturn {
  // State
  isLoading: boolean;
  currentStep: string;
  error: string | null;
  progress: number;
  
  // Deposit
  executeDepositBridge: (amount: string) => Promise<void>;
  
  // Withdraw
  executeWithdrawBridge: (amount: string) => Promise<void>;
  
  // Utilities
  checkNeedsApproval: (amount: string) => Promise<boolean>;
  estimateGas: (amount: string, direction: BridgeDirection) => Promise<{ gas: string; fee: string }>;
  validateAmount: (amount: string, direction: BridgeDirection) => Promise<{ valid: boolean; error?: string }>;
  
  // Reset
  reset: () => void;
}

const STEP_MESSAGES: Record<string, string> = {
  'idle': 'Ready',
  'checking-allowance': 'Checking allowance...',
  'approving': 'Approve USDC in wallet...',
  'waiting-approval': 'Waiting for approval confirmation...',
  'depositing': 'Confirm deposit in wallet...',
  'waiting-deposit': 'Waiting for deposit confirmation...',
  'preparing': 'Preparing withdrawal...',
  'signing': 'Sign transaction in wallet...',
  'broadcasting': 'Broadcasting transaction...',
  'pending': 'Transaction submitted!',
  'completed': 'Bridge complete!',
  'error': 'Transaction failed',
};

const STEP_PROGRESS: Record<string, number> = {
  'idle': 0,
  'checking-allowance': 10,
  'approving': 20,
  'waiting-approval': 40,
  'depositing': 60,
  'waiting-deposit': 80,
  'preparing': 10,
  'signing': 30,
  'broadcasting': 50,
  'pending': 80,
  'completed': 100,
  'error': 0,
};

// ============ Hook ============

export function useBridge(): UseBridgeReturn {
  const { wallet, refreshBalances, addTransaction } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // ============ Deposit (ETH → STX) ============

  const executeDepositBridge = useCallback(async (amount: string) => {
    if (!wallet.ethereumAddress || !wallet.stacksAddress) {
      toast.error('Please connect both wallets');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('checking-allowance');
    setProgress(10);

    const txId = generateTxId();

    try {
      const result = await executeDeposit(
        {
          amount,
          stacksRecipient: wallet.stacksAddress,
          ethereumSender: wallet.ethereumAddress,
          network: wallet.network,
        },
        (depositProgress: DepositProgress) => {
          setCurrentStep(depositProgress.step);
          setProgress(STEP_PROGRESS[depositProgress.step] || 0);
          
          if (depositProgress.step === 'error') {
            setError(depositProgress.error || 'Unknown error');
          }
        }
      );

      // Save transaction
      const transaction: BridgeTransaction = {
        id: txId,
        direction: 'deposit',
        amount,
        fromAddress: wallet.ethereumAddress,
        toAddress: wallet.stacksAddress,
        status: 'processing',
        txHash: result.depositTxHash,
        timestamp: Date.now(),
        network: wallet.network,
        sourceTxHash: result.depositTxHash,
      };

      saveBridgeTransaction(transaction);
      addTransaction(transaction);

      toast.success('Deposit initiated!', {
        description: `Bridging ${amount} USDC to Stacks. This may take 10-30 minutes.`,
      });

      // Refresh balances
      await refreshBalances();

    } catch (err: any) {
      const errorMessage = err.message || 'Deposit failed';
      setError(errorMessage);
      setCurrentStep('error');
      toast.error('Deposit failed', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [wallet, refreshBalances, addTransaction]);

  // ============ Withdraw (STX → ETH) ============

  const executeWithdrawBridge = useCallback(async (amount: string) => {
    if (!wallet.stacksAddress || !wallet.ethereumAddress) {
      toast.error('Please connect both wallets');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('preparing');
    setProgress(10);

    const txId = generateTxId();

    try {
      const result = await executeWithdraw(
        {
          amount,
          ethereumRecipient: wallet.ethereumAddress,
          stacksSender: wallet.stacksAddress,
          network: wallet.network,
        },
        (withdrawProgress: WithdrawProgress) => {
          setCurrentStep(withdrawProgress.step);
          setProgress(STEP_PROGRESS[withdrawProgress.step] || 0);
          
          if (withdrawProgress.step === 'error') {
            setError(withdrawProgress.error || 'Unknown error');
          }
        }
      );

      // Save transaction
      const transaction: BridgeTransaction = {
        id: txId,
        direction: 'withdraw',
        amount,
        fromAddress: wallet.stacksAddress,
        toAddress: wallet.ethereumAddress,
        status: 'processing',
        txHash: result.txId,
        timestamp: Date.now(),
        network: wallet.network,
        sourceTxHash: result.txId,
      };

      saveBridgeTransaction(transaction);
      addTransaction(transaction);

      toast.success('Withdrawal initiated!', {
        description: `Bridging ${amount} USDCx to Ethereum. This may take 20-60 minutes.`,
      });

      // Refresh balances
      await refreshBalances();

    } catch (err: any) {
      const errorMessage = err.message || 'Withdrawal failed';
      setError(errorMessage);
      setCurrentStep('error');
      toast.error('Withdrawal failed', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [wallet, refreshBalances, addTransaction]);

  // ============ Utilities ============

  const checkNeedsApproval = useCallback(async (amount: string): Promise<boolean> => {
    if (!wallet.ethereumAddress) return true;
    return needsApproval(wallet.ethereumAddress, amount, wallet.network);
  }, [wallet.ethereumAddress, wallet.network]);

  const estimateGas = useCallback(async (
    amount: string, 
    direction: BridgeDirection
  ): Promise<{ gas: string; fee: string }> => {
    if (direction === 'deposit' && wallet.ethereumAddress && wallet.stacksAddress) {
      const estimate = await estimateDepositGas({
        amount,
        stacksRecipient: wallet.stacksAddress,
        ethereumSender: wallet.ethereumAddress,
        network: wallet.network,
      });
      
      const gasCostEth = Number(estimate.totalGas * estimate.gasPriceWei) / 1e18;
      return {
        gas: estimate.totalGas.toString(),
        fee: `~${gasCostEth.toFixed(6)} ETH`,
      };
    }
    
    // Stacks transactions use STX for fees
    return {
      gas: '0',
      fee: '~0.001 STX',
    };
  }, [wallet]);

  const validateAmount = useCallback(async (
    amount: string,
    direction: BridgeDirection
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return { valid: false, error: 'Please enter a valid amount' };
      }

      if (direction === 'deposit') {
        const usdcBalance = Number(wallet.balances.usdc) / 1e6;
        if (parsedAmount > usdcBalance) {
          return { valid: false, error: 'Insufficient USDC balance' };
        }
        if (parsedAmount < 1) {
          return { valid: false, error: 'Minimum deposit is 1 USDC' };
        }
      } else {
        const validation = await validateWithdrawAmount(
          amount,
          wallet.balances.usdcx,
          wallet.network
        );
        return validation;
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Invalid amount' };
    }
  }, [wallet.balances, wallet.network]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setCurrentStep('idle');
    setError(null);
    setProgress(0);
  }, []);

  return {
    isLoading,
    currentStep: STEP_MESSAGES[currentStep] || currentStep,
    error,
    progress,
    executeDepositBridge,
    executeWithdrawBridge,
    checkNeedsApproval,
    estimateGas,
    validateAmount,
    reset,
  };
}
