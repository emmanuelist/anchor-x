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
  /** Real gas fee in USD (fetched from blockchain) */
  gasFeeUsd?: number;
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
 * Backfill gas fees for transactions that don't have them
 * Call this on app load to update historical transactions
 */
export async function backfillGasFees(): Promise<void> {
  const transactions = getBridgeTransactions();
  let updated = false;

  for (const tx of transactions) {
    // Skip if already has gas fee
    if (tx.gasFeeUsd !== undefined) continue;

    try {
      let gasFee = 0;
      if (tx.direction === 'deposit') {
        // Ethereum transaction
        gasFee = await fetchRealGasFee(tx.txHash, tx.network);
      } else {
        // Stacks transaction
        gasFee = await fetchStacksGasFee(tx.txHash, tx.network);
      }

      if (gasFee > 0) {
        tx.gasFeeUsd = gasFee;
        updated = true;
      }
    } catch (e) {
      console.warn(`Could not fetch gas fee for tx ${tx.id}`);
    }
  }

  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
}

/**
 * Generate a unique transaction ID
 */
export function generateTxId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ Gas Fee Utilities ============

/**
 * Fetch real gas cost from an Ethereum transaction receipt
 * Returns the gas fee in USD
 */
export async function fetchRealGasFee(
  txHash: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<number> {
  try {
    // Use the appropriate RPC endpoint
    const rpcUrl = network === 'mainnet' 
      ? 'https://eth-mainnet.g.alchemy.com/v2/demo'
      : 'https://ethereum-sepolia-rpc.publicnode.com';

    // Get transaction receipt
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });
    const receiptData = await receiptResponse.json();
    
    if (!receiptData.result) {
      console.warn('Transaction receipt not found');
      return 0;
    }

    const gasUsed = BigInt(receiptData.result.gasUsed);
    const effectiveGasPrice = BigInt(receiptData.result.effectiveGasPrice);
    
    // Calculate gas cost in Wei
    const gasCostWei = gasUsed * effectiveGasPrice;
    
    // Convert Wei to ETH
    const gasCostEth = Number(gasCostWei) / 1e18;
    
    // Get ETH price in USD (use a simple fetch or fallback)
    const ethPriceUsd = await fetchEthPrice();
    
    // Calculate USD value
    const gasCostUsd = gasCostEth * ethPriceUsd;
    
    return Math.round(gasCostUsd * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error fetching gas fee:', error);
    return 0;
  }
}

/**
 * Fetch current ETH price in USD
 */
async function fetchEthPrice(): Promise<number> {
  try {
    // Use CoinGecko API (free, no key needed)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    return data.ethereum?.usd || 3000; // Fallback to $3000 if API fails
  } catch {
    return 3000; // Fallback ETH price
  }
}

/**
 * Fetch real gas cost for a Stacks transaction
 * Returns the gas fee in USD
 */
export async function fetchStacksGasFee(
  txId: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<number> {
  try {
    const baseUrl = network === 'mainnet'
      ? 'https://api.hiro.so'
      : 'https://api.testnet.hiro.so';

    const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`);
    const data = await response.json();

    if (!data.fee_rate) {
      return 0;
    }

    // Stacks fee is in microSTX, convert to STX
    const feeStx = Number(data.fee_rate) / 1e6;
    
    // Get STX price in USD
    const stxPriceUsd = await fetchStxPrice();
    
    return Math.round(feeStx * stxPriceUsd * 100) / 100;
  } catch (error) {
    console.error('Error fetching Stacks gas fee:', error);
    return 0;
  }
}

/**
 * Fetch current STX price in USD
 */
async function fetchStxPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd'
    );
    const data = await response.json();
    return data.blockstack?.usd || 1.5; // Fallback to $1.50 if API fails
  } catch {
    return 1.5; // Fallback STX price
  }
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

// ============ Blockchain History Sync ============

/**
 * Fetch deposit transactions from Ethereum blockchain
 */
async function fetchEthereumDeposits(
  ethereumAddress: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<BridgeTransaction[]> {
  const rpcUrl = network === 'mainnet'
    ? 'https://ethereum.publicnode.com'
    : 'https://ethereum-sepolia-rpc.publicnode.com';
  
  const usdcAddress = network === 'mainnet'
    ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    : '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  
  const xReserveAddress = network === 'mainnet'
    ? '0x8888888199b2Df864bf6782596607d6D5EBb4e3Ce'
    : '0x008888878f94C0d87defdf0B07f46B93C1934442';

  try {
    // Get current block
    console.log('[fetchEthereumDeposits] Fetching current block from:', rpcUrl);
    const blockResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    const blockData = await blockResponse.json();
    console.log('[fetchEthereumDeposits] Block response:', blockData);
    const currentBlock = parseInt(blockData.result, 16);
    
    // Query last 50000 blocks (max range for public RPC)
    const fromBlock = Math.max(0, currentBlock - 45000);
    console.log('[fetchEthereumDeposits] Querying from block', fromBlock, 'to', currentBlock);
    
    // Query USDC Transfer events FROM user TO xReserve (deposits)
    const paddedAddress = ethereumAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const paddedXReserve = xReserveAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    
    console.log('[fetchEthereumDeposits] Querying logs for USDC transfers from', ethereumAddress, 'to', xReserveAddress);
    const logsResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          address: usdcAddress,
          fromBlock: '0x' + fromBlock.toString(16),
          toBlock: 'latest',
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
            '0x' + paddedAddress, // from user
            '0x' + paddedXReserve, // to xReserve
          ],
        }],
        id: 2,
      }),
    });
    const logsData = await logsResponse.json();
    console.log('[fetchEthereumDeposits] Logs response:', logsData);
    
    if (!logsData.result || !Array.isArray(logsData.result)) {
      console.log('[fetchEthereumDeposits] No results found or invalid response');
      return [];
    }

    // Convert logs to transactions
    const transactions: BridgeTransaction[] = [];
    
    for (const log of logsData.result) {
      const amount = parseInt(log.data, 16) / 1000000; // USDC has 6 decimals
      const blockNum = parseInt(log.blockNumber, 16);
      const timestamp = parseInt(log.blockTimestamp || '0', 16) * 1000 || Date.now();
      
      transactions.push({
        id: `sync_eth_${log.transactionHash}`,
        direction: 'deposit',
        amount: amount.toFixed(2),
        fromAddress: ethereumAddress,
        toAddress: '', // We don't have the Stacks recipient from the log
        status: 'completed',
        txHash: log.transactionHash,
        sourceTxHash: log.transactionHash,
        timestamp,
        network,
      });
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching Ethereum deposits:', error);
    return [];
  }
}

/**
 * Fetch withdrawal transactions from Stacks blockchain
 */
async function fetchStacksWithdrawals(
  stacksAddress: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<BridgeTransaction[]> {
  const apiUrl = network === 'mainnet'
    ? 'https://api.hiro.so'
    : 'https://api.testnet.hiro.so';
  
  const usdcxContract = network === 'mainnet'
    ? 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1'
    : 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1';

  try {
    // Fetch transactions for the address
    const response = await fetch(
      `${apiUrl}/extended/v1/address/${stacksAddress}/transactions?limit=50`
    );
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    const transactions: BridgeTransaction[] = [];
    
    for (const tx of data.results) {
      // Only process contract calls to usdcx-v1 burn function
      if (tx.tx_type !== 'contract_call') continue;
      if (tx.contract_call?.contract_id !== usdcxContract) continue;
      if (tx.contract_call?.function_name !== 'burn') continue;
      
      // Parse amount from function args
      let amount = '0';
      if (tx.contract_call?.function_args?.[0]?.repr) {
        const amountStr = tx.contract_call.function_args[0].repr.replace('u', '');
        amount = (parseInt(amountStr) / 1000000).toFixed(2);
      }
      
      const status = tx.tx_status === 'success' ? 'completed' : 
                     tx.tx_status === 'pending' ? 'pending' : 'failed';
      
      transactions.push({
        id: `sync_stx_${tx.tx_id}`,
        direction: 'withdraw',
        amount,
        fromAddress: stacksAddress,
        toAddress: '', // Ethereum recipient is in the event data
        status,
        txHash: tx.tx_id,
        sourceTxHash: tx.tx_id,
        timestamp: tx.burn_block_time ? tx.burn_block_time * 1000 : Date.now(),
        network,
      });
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching Stacks withdrawals:', error);
    return [];
  }
}

/**
 * Sync transaction history from blockchain
 * Fetches deposits from Ethereum and withdrawals from Stacks
 */
export async function syncFromBlockchain(
  ethereumAddress: string | null,
  stacksAddress: string | null,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<{ synced: number; total: number }> {
  console.log('[syncFromBlockchain] Starting sync with addresses:', { ethereumAddress, stacksAddress, network });
  
  const existingTxs = getBridgeTransactions();
  const existingHashes = new Set(existingTxs.map(tx => tx.txHash.toLowerCase()));
  console.log('[syncFromBlockchain] Existing transactions:', existingTxs.length, 'existing hashes:', existingHashes.size);
  
  const newTransactions: BridgeTransaction[] = [];
  
  // Fetch Ethereum deposits
  if (ethereumAddress) {
    console.log('[syncFromBlockchain] Fetching Ethereum deposits for:', ethereumAddress);
    const ethDeposits = await fetchEthereumDeposits(ethereumAddress, network);
    console.log('[syncFromBlockchain] Found Ethereum deposits:', ethDeposits.length);
    for (const tx of ethDeposits) {
      if (!existingHashes.has(tx.txHash.toLowerCase())) {
        newTransactions.push(tx);
      }
    }
  }
  
  // Fetch Stacks withdrawals
  if (stacksAddress) {
    console.log('[syncFromBlockchain] Fetching Stacks withdrawals for:', stacksAddress);
    const stxWithdrawals = await fetchStacksWithdrawals(stacksAddress, network);
    console.log('[syncFromBlockchain] Found Stacks withdrawals:', stxWithdrawals.length);
    for (const tx of stxWithdrawals) {
      if (!existingHashes.has(tx.txHash.toLowerCase())) {
        newTransactions.push(tx);
      }
    }
  }
  
  console.log('[syncFromBlockchain] New transactions to add:', newTransactions.length);
  
  // Add new transactions to storage
  if (newTransactions.length > 0) {
    const allTransactions = [...newTransactions, ...existingTxs];
    // Sort by timestamp descending
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    // Keep last 100
    const trimmed = allTransactions.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log('[syncFromBlockchain] Saved', trimmed.length, 'transactions to localStorage');
  }
  
  return {
    synced: newTransactions.length,
    total: existingTxs.length + newTransactions.length,
  };
}
