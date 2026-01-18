/**
 * Transaction Status Checker
 * 
 * Monitors and updates transaction status from blockchain explorers
 */

import { getBridgeTransactions, updateBridgeTransaction, type BridgeTransaction } from './index';

const STACKS_API_URL = 'https://api.testnet.hiro.so';

interface StacksTransactionResponse {
  tx_id: string;
  tx_status: 'success' | 'abort_by_response' | 'abort_by_post_condition' | 'pending';
  tx_type: string;
  block_height?: number;
  block_hash?: string;
}

/**
 * Check status of a Stacks transaction
 */
export async function checkStacksTransactionStatus(txId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  blockHeight?: number;
}> {
  try {
    // Clean up txId - remove 0x prefix if present and ensure proper format
    const cleanTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
    
    const response = await fetch(`${STACKS_API_URL}/extended/v1/tx/${cleanTxId}`);
    
    if (!response.ok) {
      // If 404, transaction might not be indexed yet
      if (response.status === 404) {
        return { status: 'pending' };
      }
      throw new Error(`Failed to fetch transaction: ${response.status}`);
    }
    
    const data: StacksTransactionResponse = await response.json();
    
    if (data.tx_status === 'success') {
      return { status: 'completed', blockHeight: data.block_height };
    } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      return { status: 'failed' };
    } else {
      return { status: 'pending' };
    }
  } catch (error) {
    console.error('Error checking Stacks transaction status:', error);
    return { status: 'pending' };
  }
}

/**
 * Check status of an Ethereum transaction
 */
export async function checkEthereumTransactionStatus(txHash: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  blockNumber?: number;
}> {
  try {
    // Use Sepolia RPC
    const response = await fetch('https://rpc.sepolia.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    
    const data = await response.json();
    
    if (!data.result) {
      return { status: 'pending' };
    }
    
    const receipt = data.result;
    const status = parseInt(receipt.status, 16);
    
    if (status === 1) {
      return { status: 'completed', blockNumber: parseInt(receipt.blockNumber, 16) };
    } else {
      return { status: 'failed' };
    }
  } catch (error) {
    console.error('Error checking Ethereum transaction status:', error);
    return { status: 'pending' };
  }
}

/**
 * Update all pending/processing transactions with their actual status
 */
export async function syncTransactionStatuses(): Promise<BridgeTransaction[]> {
  const transactions = getBridgeTransactions();
  const pendingTxs = transactions.filter(
    tx => tx.status === 'pending' || tx.status === 'processing'
  );
  
  for (const tx of pendingTxs) {
    try {
      let newStatus: 'pending' | 'processing' | 'completed' | 'failed';
      
      if (tx.direction === 'withdraw') {
        // Withdraw uses Stacks transaction
        const result = await checkStacksTransactionStatus(tx.txHash);
        newStatus = result.status === 'pending' ? 'processing' : result.status;
      } else {
        // Deposit uses Ethereum transaction
        const result = await checkEthereumTransactionStatus(tx.txHash);
        newStatus = result.status;
      }
      
      if (newStatus !== tx.status) {
        updateBridgeTransaction(tx.id, { status: newStatus });
      }
    } catch (error) {
      console.error(`Error syncing transaction ${tx.id}:`, error);
    }
  }
  
  // Return updated transactions
  return getBridgeTransactions();
}

/**
 * Check a single transaction and return updated status
 */
export async function checkTransactionStatus(tx: BridgeTransaction): Promise<'pending' | 'processing' | 'completed' | 'failed'> {
  try {
    if (tx.direction === 'withdraw') {
      const result = await checkStacksTransactionStatus(tx.txHash);
      return result.status === 'pending' ? 'processing' : result.status;
    } else {
      const result = await checkEthereumTransactionStatus(tx.txHash);
      return result.status;
    }
  } catch {
    return tx.status;
  }
}
