/**
 * Bridge Service - Main Entry Point
 * 
 * Combines deposit and withdraw functionality for the USDCx bridge
 */

// Re-export deposit functions
export {
  executeDeposit,
  needsApproval,
  approveUSDC,
  estimateDepositGas,
  formatGasCost,
  type DepositParams,
  type DepositResult,
  type DepositStep,
  type DepositProgress,
} from './deposit';

// Re-export withdraw functions
export {
  executeWithdraw,
  getMinWithdrawAmount,
  getWithdrawFeeEstimate,
  validateWithdrawAmount,
  formatUSDCx,
  getStacksExplorerUrl,
  type WithdrawParams,
  type WithdrawResult,
  type WithdrawStep,
  type WithdrawProgress,
} from './withdraw';

// Re-export encoding functions
export {
  encodeStacksAddressToBytes32,
  isValidStacksAddress,
  isValidEthereumAddress,
} from './encoding';

// Re-export transaction status functions
export {
  checkStacksTransactionStatus,
  checkEthereumTransactionStatus,
  syncTransactionStatuses,
  checkTransactionStatus,
} from './transactionStatus';

// ============ Combined Types ============

export type BridgeDirection = 'deposit' | 'withdraw';

export interface BridgeTransaction {
  id: string;
  direction: BridgeDirection;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash: string;
  timestamp: number;
  network: 'testnet' | 'mainnet';
  /** For deposits: Ethereum tx hash. For withdraws: Stacks tx id */
  sourceTxHash: string;
  /** For deposits: Stacks tx id (once minted). For withdraws: Ethereum tx hash (once claimed) */
  destinationTxHash?: string;
}

// ============ Transaction Tracking ============

const STORAGE_KEY = 'anchorx_bridge_transactions';

/**
 * Save a bridge transaction to local storage
 */
export function saveBridgeTransaction(tx: BridgeTransaction): void {
  const transactions = getBridgeTransactions();
  transactions.unshift(tx);
  // Keep last 100 transactions
  const trimmed = transactions.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Get all bridge transactions from local storage
 */
export function getBridgeTransactions(): BridgeTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Update a bridge transaction in local storage
 */
export function updateBridgeTransaction(
  id: string, 
  updates: Partial<BridgeTransaction>
): void {
  const transactions = getBridgeTransactions();
  const index = transactions.findIndex(tx => tx.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}

/**
 * Generate a unique transaction ID
 */
export function generateTxId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ Utility Functions ============

/**
 * Format amount for display
 */
export function formatAmount(amount: string | bigint, decimals = 6): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(amount);
  const num = Number(value) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Parse display amount to micro units
 */
export function parseDisplayAmount(amount: string, decimals = 6): bigint {
  const [whole, decimal = ''] = amount.split('.');
  const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedDecimal);
}

/**
 * Get estimated bridge time based on direction
 */
export function getEstimatedBridgeTime(direction: BridgeDirection): string {
  // Deposit (ETH → STX): Typically ~10-30 minutes
  // Withdraw (STX → ETH): Typically ~20-60 minutes
  if (direction === 'deposit') {
    return '10-30 minutes';
  }
  return '20-60 minutes';
}

/**
 * Get chain name from direction
 */
export function getSourceChain(direction: BridgeDirection): 'Ethereum' | 'Stacks' {
  return direction === 'deposit' ? 'Ethereum' : 'Stacks';
}

export function getDestinationChain(direction: BridgeDirection): 'Ethereum' | 'Stacks' {
  return direction === 'deposit' ? 'Stacks' : 'Ethereum';
}

/**
 * Get token name from direction
 */
export function getSourceToken(direction: BridgeDirection): 'USDC' | 'USDCx' {
  return direction === 'deposit' ? 'USDC' : 'USDCx';
}

export function getDestinationToken(direction: BridgeDirection): 'USDC' | 'USDCx' {
  return direction === 'deposit' ? 'USDCx' : 'USDC';
}
