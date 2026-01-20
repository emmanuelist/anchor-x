/**
 * USDCx Transfer Module
 * Handles USDCx transfers within Stacks network
 */

import { request } from '@stacks/connect';
import { Cl, Pc } from '@stacks/transactions';
import { NETWORK_CONFIG, type NetworkEnvironment } from '../constants/contracts';

// USDCx contract details
const USDCX_CONTRACTS = {
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'usdcx',
    assetName: 'usdcx-token',
  },
  mainnet: {
    address: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
    name: 'usdcx',
    assetName: 'usdcx-token',
  },
};

// Storage keys
const RECENT_RECIPIENTS_KEY = 'anchorx_recent_recipients';
const ADDRESS_BOOK_KEY = 'anchorx_address_book';

export interface RecentRecipient {
  address: string;
  label?: string;
  lastUsed: number;
  totalTransfers: number;
}

export interface AddressBookEntry {
  address: string;
  label: string;
  createdAt: number;
}

export interface TransferResult {
  success: boolean;
  txId?: string;
  error?: string;
}

/**
 * Transfer USDCx to another Stacks address
 */
export async function transferUSDCx(
  senderAddress: string,
  recipientAddress: string,
  amount: string,
  memo?: string,
  network: NetworkEnvironment = 'testnet'
): Promise<TransferResult> {
  const contract = USDCX_CONTRACTS[network];
  
  try {
    // Convert amount to micro-units (6 decimals)
    const microAmount = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

    // Create post-condition to ensure exact amount is sent
    const postCondition = Pc.principal(senderAddress)
      .willSendEq(microAmount)
      .ft(`${contract.address}.${contract.name}`, contract.assetName);

    // Build function arguments
    const functionArgs = [
      Cl.uint(microAmount),
      Cl.principal(senderAddress),
      Cl.principal(recipientAddress),
      memo ? Cl.some(Cl.bufferFromUtf8(memo)) : Cl.none(),
    ];

    // Execute the transfer
    const response = await request('stx_callContract', {
      contract: `${contract.address}.${contract.name}`,
      functionName: 'transfer',
      functionArgs,
      postConditions: [postCondition],
      network: network,
    });

    console.log('[transferUSDCx] Transfer TX:', response.txid);

    // Save to recent recipients
    addRecentRecipient(recipientAddress);

    return {
      success: true,
      txId: response.txid,
    };
  } catch (error) {
    console.error('[transferUSDCx] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
}

/**
 * Get transfer transaction status
 */
export async function getTransferStatus(
  txId: string,
  network: NetworkEnvironment = 'testnet'
): Promise<{
  status: 'pending' | 'success' | 'failed';
  confirmations?: number;
}> {
  const apiUrl = NETWORK_CONFIG[network].stacks.apiUrl;
  
  try {
    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
    const data = await response.json();
    
    if (data.tx_status === 'success') {
      return { status: 'success', confirmations: data.block_height ? 1 : 0 };
    } else if (data.tx_status === 'pending') {
      return { status: 'pending', confirmations: 0 };
    } else {
      return { status: 'failed' };
    }
  } catch (error) {
    console.error('[getTransferStatus] Error:', error);
    return { status: 'pending' };
  }
}

// ============ Recent Recipients ============

export function getRecentRecipients(): RecentRecipient[] {
  try {
    const stored = localStorage.getItem(RECENT_RECIPIENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading recent recipients:', error);
  }
  return [];
}

export function addRecentRecipient(address: string, label?: string): void {
  const recipients = getRecentRecipients();
  const existingIndex = recipients.findIndex(r => r.address === address);
  
  if (existingIndex >= 0) {
    // Update existing
    recipients[existingIndex].lastUsed = Date.now();
    recipients[existingIndex].totalTransfers += 1;
    if (label) recipients[existingIndex].label = label;
  } else {
    // Add new
    recipients.unshift({
      address,
      label,
      lastUsed: Date.now(),
      totalTransfers: 1,
    });
  }
  
  // Keep only last 10
  const trimmed = recipients.slice(0, 10);
  localStorage.setItem(RECENT_RECIPIENTS_KEY, JSON.stringify(trimmed));
}

export function removeRecentRecipient(address: string): void {
  const recipients = getRecentRecipients();
  const filtered = recipients.filter(r => r.address !== address);
  localStorage.setItem(RECENT_RECIPIENTS_KEY, JSON.stringify(filtered));
}

// ============ Address Book ============

export function getAddressBook(): AddressBookEntry[] {
  try {
    const stored = localStorage.getItem(ADDRESS_BOOK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading address book:', error);
  }
  return [];
}

export function addToAddressBook(address: string, label: string): void {
  const book = getAddressBook();
  const existingIndex = book.findIndex(e => e.address === address);
  
  if (existingIndex >= 0) {
    book[existingIndex].label = label;
  } else {
    book.push({
      address,
      label,
      createdAt: Date.now(),
    });
  }
  
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(book));
}

export function removeFromAddressBook(address: string): void {
  const book = getAddressBook();
  const filtered = book.filter(e => e.address !== address);
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(filtered));
}

export function updateAddressBookLabel(address: string, newLabel: string): void {
  const book = getAddressBook();
  const entry = book.find(e => e.address === address);
  if (entry) {
    entry.label = newLabel;
    localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(book));
  }
}

// ============ Validation ============

export function isValidStacksAddress(address: string, network: NetworkEnvironment = 'testnet'): boolean {
  if (!address) return false;
  
  // Testnet addresses start with ST, mainnet with SP
  const prefix = network === 'testnet' ? 'ST' : 'SP';
  
  // Basic validation - case insensitive prefix check
  if (!address.toUpperCase().startsWith(prefix)) return false;
  if (address.length < 30 || address.length > 50) return false;
  
  // Check for valid c32 characters (Stacks uses c32check encoding, not base58)
  // Valid c32 characters: 0-9, A-H, J-N, P-Z (no I, L, O)
  const validChars = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz]+$/;
  return validChars.test(address.slice(2));
}

/**
 * Estimate transfer fee (in STX)
 */
export function estimateTransferFee(): string {
  // USDCx transfer typically costs ~0.001 STX
  return '0.001';
}
