/**
 * Stacks Wallet Service
 * 
 * Handles wallet connection, balance fetching, and transaction signing
 * for the Stacks blockchain using @stacks/connect
 */

import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { 
  fetchCallReadOnlyFunction, 
  cvToValue,
  principalCV,
  uintCV,
  bufferCV,
  ClarityValue,
} from '@stacks/transactions';
import type { NetworkEnvironment } from '../constants/contracts';
import { 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG,
  PROTOCOL_CONSTANTS,
} from '../constants/contracts';

// ============ Types ============

export interface StacksWalletState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
}

export interface StacksConnectionResult {
  address: string;
  publicKey: string;
}

// ============ Wallet Connection ============

// Storage key for persisting Stacks address
const STACKS_ADDRESS_KEY = 'anchorx_stacks_address';
const STACKS_PUBKEY_KEY = 'anchorx_stacks_pubkey';

/**
 * Connect to a Stacks wallet (Leather, Xverse, etc.)
 * @param forceSelect - If true, always show wallet selection dialog
 */
export async function connectStacksWallet(forceSelect = true): Promise<StacksConnectionResult> {
  try {
    const response = await connect({
      forceWalletSelect: forceSelect,  // Always prompt for wallet selection
    });
    
    // The response contains addresses array
    // Index 0: Bitcoin address
    // Index 1: Bitcoin Ordinals address  
    // Index 2: Stacks address
    const addresses = response.addresses;
    
    // Find the Stacks address (starts with SP or ST)
    const stacksAddressInfo = addresses.find(
      (addr) => addr.address.startsWith('SP') || addr.address.startsWith('ST')
    );
    
    if (!stacksAddressInfo) {
      throw new Error('No Stacks address found in wallet response');
    }
    
    // Persist to localStorage for session restoration
    localStorage.setItem(STACKS_ADDRESS_KEY, stacksAddressInfo.address);
    if (stacksAddressInfo.publicKey) {
      localStorage.setItem(STACKS_PUBKEY_KEY, stacksAddressInfo.publicKey);
    }
    
    return {
      address: stacksAddressInfo.address,
      publicKey: stacksAddressInfo.publicKey || '',
    };
  } catch (error) {
    console.error('Failed to connect Stacks wallet:', error);
    throw error;
  }
}

/**
 * Disconnect from the Stacks wallet and clear stored data
 */
export function disconnectStacksWallet(): void {
  disconnect();
  localStorage.removeItem(STACKS_ADDRESS_KEY);
  localStorage.removeItem(STACKS_PUBKEY_KEY);
}

/**
 * Check if a Stacks wallet is currently connected
 * Uses both @stacks/connect state AND our persisted address
 */
export function isStacksWalletConnected(): boolean {
  // Check our persisted address first
  const persistedAddress = localStorage.getItem(STACKS_ADDRESS_KEY);
  if (persistedAddress) {
    return true;
  }
  // Fallback to @stacks/connect
  return isConnected();
}

/**
 * Get the currently connected Stacks address
 * Tries persisted address first, then @stacks/connect storage
 */
export function getConnectedStacksAddress(): string | null {
  // Try our persisted address first
  const persistedAddress = localStorage.getItem(STACKS_ADDRESS_KEY);
  if (persistedAddress) {
    return persistedAddress;
  }
  
  // Fallback to @stacks/connect local storage
  try {
    const storage = getLocalStorage();
    if (storage?.addresses) {
      const stacksAddr = storage.addresses.find(
        (addr: { address: string }) => 
          addr.address.startsWith('SP') || addr.address.startsWith('ST')
      );
      return stacksAddr?.address || null;
    }
  } catch {
    return null;
  }
  return null;
}

// ============ Balance Fetching ============

/**
 * Fetch USDCx balance for a Stacks address using the Hiro API
 */
export async function fetchUSDCxBalance(
  address: string,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const { deployer, usdcxToken } = CONTRACT_ADDRESSES[network].stacks;
  const apiUrl = NETWORK_CONFIG[network].stacks.apiUrl;
  const contractId = `${deployer}.${usdcxToken}`;
  
  try {
    // First, try to fetch fungible token balances from the API
    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/balances`
    );
    
    if (!response.ok) {
      console.warn(`Failed to fetch balances: ${response.status}`);
      return 0n;
    }
    
    const data = await response.json();
    
    // Look for USDCx in fungible tokens
    const fungibleTokens = data.fungible_tokens || {};
    
    console.log('Checking fungible tokens for USDCx...');
    console.log('Looking for contractId:', contractId);
    console.log('Available tokens:', Object.keys(fungibleTokens));
    
    // The token key format is: "contractAddress.contractName::tokenName"
    // For USDCx it would be like: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx::usdcx-token"
    for (const [tokenKey, tokenData] of Object.entries(fungibleTokens)) {
      const keyLower = tokenKey.toLowerCase();
      const contractIdLower = contractId.toLowerCase();
      
      if (keyLower.includes(contractIdLower) || keyLower.includes('usdcx')) {
        const balance = (tokenData as any).balance;
        console.log(`✅ Found USDCx balance: ${balance} (key: ${tokenKey})`);
        return BigInt(balance || 0);
      }
    }
    
    // If not found in fungible tokens, try direct contract call
    console.log('USDCx not found in fungible tokens, trying contract call...');
    return await fetchUSDCxBalanceFromContract(address, network);
  } catch (error) {
    console.error('Failed to fetch USDCx balance:', error);
    return 0n;
  }
}

/**
 * Fetch USDCx balance directly from the contract
 */
async function fetchUSDCxBalanceFromContract(
  address: string,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const { deployer, usdcxToken } = CONTRACT_ADDRESSES[network].stacks;
  
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxToken,
      functionName: 'get-balance',
      functionArgs: [principalCV(address)],
      senderAddress: address,
      network: network,
    });
    
    // The response is (ok uint) - extract the uint value
    const value = cvToValue(response);
    
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return BigInt(value.value);
    }
    
    // Direct uint response
    if (typeof value === 'bigint' || typeof value === 'number') {
      return BigInt(value);
    }
    
    return 0n;
  } catch (error) {
    console.error('Failed to fetch USDCx balance from contract:', error);
    return 0n;
  }
}

/**
 * Fetch STX balance for gas estimation
 */
export async function fetchSTXBalance(
  address: string,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const apiUrl = NETWORK_CONFIG[network].stacks.apiUrl;
  
  try {
    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/stx`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    return BigInt(data.balance || 0);
  } catch (error) {
    console.error('Failed to fetch STX balance:', error);
    return 0n;
  }
}

/**
 * Format USDCx amount from micro units to display string
 */
export function formatUSDCx(microAmount: bigint | number): string {
  const amount = typeof microAmount === 'bigint' ? microAmount : BigInt(microAmount);
  const decimals = PROTOCOL_CONSTANTS.USDC_DECIMALS;
  const divisor = BigInt(10 ** decimals);
  
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  
  return `${wholePart}.${fractionalStr}`;
}

/**
 * Parse display amount to micro units
 */
export function parseUSDCxAmount(displayAmount: string): bigint {
  const decimals = PROTOCOL_CONSTANTS.USDC_DECIMALS;
  const parts = displayAmount.split('.');
  
  const wholePart = BigInt(parts[0] || '0');
  let fractionalPart = BigInt(0);
  
  if (parts[1]) {
    const fractionalStr = parts[1].padEnd(decimals, '0').slice(0, decimals);
    fractionalPart = BigInt(fractionalStr);
  }
  
  return wholePart * BigInt(10 ** decimals) + fractionalPart;
}

// ============ Contract Read Functions ============

/**
 * Get USDCx token info
 */
export async function getUSDCxTokenInfo(
  network: NetworkEnvironment = 'testnet'
): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}> {
  const { deployer, usdcxToken } = CONTRACT_ADDRESSES[network].stacks;
  
  const [nameRes, symbolRes, decimalsRes, supplyRes] = await Promise.all([
    fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxToken,
      functionName: 'get-name',
      functionArgs: [],
      senderAddress: deployer,
      network,
    }),
    fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxToken,
      functionName: 'get-symbol',
      functionArgs: [],
      senderAddress: deployer,
      network,
    }),
    fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxToken,
      functionName: 'get-decimals',
      functionArgs: [],
      senderAddress: deployer,
      network,
    }),
    fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxToken,
      functionName: 'get-total-supply',
      functionArgs: [],
      senderAddress: deployer,
      network,
    }),
  ]);
  
  return {
    name: String(cvToValue(nameRes)),
    symbol: String(cvToValue(symbolRes)),
    decimals: Number(cvToValue(decimalsRes)),
    totalSupply: BigInt(cvToValue(supplyRes) || 0),
  };
}

/**
 * Get minimum withdrawal amount
 */
export async function getMinWithdrawalAmount(
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const { deployer, usdcxV1 } = CONTRACT_ADDRESSES[network].stacks;
  
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxV1,
      functionName: 'get-min-withdrawal-amount',
      functionArgs: [],
      senderAddress: deployer,
      network,
    });
    
    return BigInt(cvToValue(response) || 0);
  } catch (error) {
    console.error('Failed to get min withdrawal amount:', error);
    return BigInt(PROTOCOL_CONSTANTS.MIN_BRIDGE_AMOUNT);
  }
}

/**
 * Check if protocol is paused
 */
export async function isProtocolPaused(
  network: NetworkEnvironment = 'testnet'
): Promise<boolean> {
  const { deployer, usdcxToken } = CONTRACT_ADDRESSES[network].stacks;
  
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: deployer,
      contractName: usdcxToken,
      functionName: 'is-protocol-paused',
      functionArgs: [],
      senderAddress: deployer,
      network,
    });
    
    return Boolean(cvToValue(response));
  } catch (error) {
    console.error('Failed to check protocol pause status:', error);
    return false;
  }
}
