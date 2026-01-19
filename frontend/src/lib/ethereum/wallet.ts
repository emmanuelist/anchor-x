/**
 * Ethereum Wallet Service
 * 
 * Handles wallet connection, balance fetching, and transaction signing
 * for Ethereum using viem
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  custom,
  formatUnits,
  parseUnits,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import type { NetworkEnvironment } from '../constants/contracts';
import { 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG,
  ERC20_ABI,
  PROTOCOL_CONSTANTS,
} from '../constants/contracts';

// ============ Types ============

export interface EthereumWalletState {
  isConnected: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
}

// ============ Chain Configuration ============

export function getEthereumChain(network: NetworkEnvironment): Chain {
  return network === 'mainnet' ? mainnet : sepolia;
}

// ============ Client Creation ============

/**
 * Create a public client for reading blockchain data
 */
export function createEthereumPublicClient(
  network: NetworkEnvironment = 'testnet'
): PublicClient {
  const chain = getEthereumChain(network);
  const rpcUrl = NETWORK_CONFIG[network].ethereum.rpcUrl;
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Create a wallet client for signing transactions
 * Requires window.ethereum (MetaMask, etc.)
 */
export async function createEthereumWalletClient(
  network: NetworkEnvironment = 'testnet'
): Promise<WalletClient | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('No Ethereum provider found');
    return null;
  }
  
  const chain = getEthereumChain(network);
  
  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });
}

// ============ Wallet Connection ============

// Storage key for persisting connection preference
const ETH_CONNECTED_KEY = 'anchorx_eth_connected';
const ETH_ADDRESS_KEY = 'anchorx_eth_address';
const ETH_WALLET_TYPE_KEY = 'anchorx_eth_wallet_type';

/**
 * Get the appropriate Ethereum provider for a specific wallet
 * Handles multi-wallet environments where multiple extensions are installed
 */
export function getProviderForWallet(walletId: string): any {
  if (typeof window === 'undefined') return null;
  
  const ethereum = window.ethereum as any;
  const okxWallet = (window as any).okxwallet;

  // OKX wallet has its own global provider
  if (walletId === 'okx') {
    if (okxWallet) return okxWallet;
    if (ethereum?.isOkxWallet || ethereum?.isOKExWallet) return ethereum;
    // Check providers array
    if (ethereum?.providers) {
      const okxProvider = ethereum.providers.find((p: any) => p.isOkxWallet || p.isOKExWallet);
      if (okxProvider) return okxProvider;
    }
    return null;
  }

  if (!ethereum) return null;

  // Handle multiple injected providers (when multiple wallets installed)
  if (ethereum.providers && Array.isArray(ethereum.providers)) {
    for (const provider of ethereum.providers) {
      // MetaMask - ensure it's real MetaMask, not Brave/Rabby impersonating
      if (walletId === 'metamask' && provider.isMetaMask && !provider.isBraveWallet && !provider.isRabby && !provider.isOkxWallet) {
        return provider;
      }
      if (walletId === 'coinbase' && provider.isCoinbaseWallet) return provider;
      if (walletId === 'trust' && provider.isTrust) return provider;
      if (walletId === 'rabby' && provider.isRabby) return provider;
      if (walletId === 'brave' && provider.isBraveWallet) return provider;
    }
  }

  // Single provider detection
  if (walletId === 'metamask' && ethereum.isMetaMask && !ethereum.isBraveWallet && !ethereum.isRabby && !ethereum.isOkxWallet) {
    return ethereum;
  }
  if (walletId === 'coinbase' && ethereum.isCoinbaseWallet) return ethereum;
  if (walletId === 'trust' && ethereum.isTrust) return ethereum;
  if (walletId === 'rabby' && ethereum.isRabby) return ethereum;
  if (walletId === 'brave' && ethereum.isBraveWallet) return ethereum;

  // If wallet not specifically detected but ethereum is available, return it as fallback
  // This helps with wallets that don't set unique flags
  return ethereum;
}

/**
 * Connect to a specific Ethereum wallet
 * The wallet selection is done in our UI modal, so we just connect directly
 * @param walletId - The wallet to connect to (metamask, coinbase, trust, okx, etc.)
 * @param network - Network to connect to
 */
export async function connectSpecificWallet(
  walletId: string,
  network: NetworkEnvironment = 'testnet'
): Promise<`0x${string}`> {
  const provider = getProviderForWallet(walletId);
  
  if (!provider) {
    throw new Error(`${walletId} wallet not detected. Please install the wallet extension.`);
  }

  try {
    // Connect directly to the selected wallet
    // Our modal already handles wallet selection, so no need for wallet_requestPermissions
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    }) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet');
    }

    const address = accounts[0] as `0x${string}`;

    // Save connection state
    localStorage.setItem(ETH_CONNECTED_KEY, 'true');
    localStorage.setItem(ETH_ADDRESS_KEY, address);
    localStorage.setItem(ETH_WALLET_TYPE_KEY, walletId);

    // Switch to correct network
    const targetChainId = NETWORK_CONFIG[network].ethereum.chainId;
    
    try {
      const currentChainId = await provider.request({
        method: 'eth_chainId',
      }) as string;

      if (parseInt(currentChainId, 16) !== targetChainId) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      }
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const chainConfig = network === 'mainnet' ? {
          chainId: `0x${targetChainId.toString(16)}`,
          chainName: 'Ethereum Mainnet',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://ethereum.publicnode.com'],
          blockExplorerUrls: ['https://etherscan.io'],
        } : {
          chainId: `0x${targetChainId.toString(16)}`,
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        };
        
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chainConfig],
        });
      }
    }

    return address;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected wallet connection');
    }
    throw error;
  }
}

/**
 * Get the last connected wallet type
 */
export function getLastConnectedWallet(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ETH_WALLET_TYPE_KEY);
}

/**
 * Request connection to Ethereum wallet (MetaMask, etc.)
 * @param network - Network to connect to
 * @param forcePrompt - If true, request fresh permission (prompts wallet selection)
 */
export async function connectEthereumWallet(
  network: NetworkEnvironment = 'testnet',
  forcePrompt = true
): Promise<`0x${string}`> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask.');
  }
  
  try {
    let accounts: string[];
    
    if (forcePrompt) {
      // Use wallet_requestPermissions to force wallet selection dialog
      // This works with MetaMask and shows account/wallet picker
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permError: any) {
        // User cancelled permission request, that's okay
        if (permError.code === 4001) {
          throw new Error('User rejected wallet connection');
        }
        // Some wallets don't support wallet_requestPermissions, fallback to eth_requestAccounts
        console.log('wallet_requestPermissions not supported, using eth_requestAccounts');
      }
    }
    
    // Request accounts
    accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet');
    }
    
    // Switch to correct network
    const targetChainId = NETWORK_CONFIG[network].ethereum.chainId;
    const currentChainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;
    
    if (parseInt(currentChainId, 16) !== targetChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Chain not added, try to add it
        if (switchError.code === 4902) {
          await addEthereumChain(network);
        } else {
          throw switchError;
        }
      }
    }
    
    const address = accounts[0] as `0x${string}`;
    
    // Persist connection info
    localStorage.setItem(ETH_CONNECTED_KEY, 'true');
    localStorage.setItem(ETH_ADDRESS_KEY, address);
    
    return address;
  } catch (error) {
    console.error('Failed to connect Ethereum wallet:', error);
    throw error;
  }
}

/**
 * Add Ethereum chain to wallet if not present
 */
async function addEthereumChain(network: NetworkEnvironment): Promise<void> {
  if (!window.ethereum) return;
  
  const chainConfig = network === 'mainnet' 
    ? {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum.publicnode.com'],
        blockExplorerUrls: ['https://etherscan.io'],
      }
    : {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      };
  
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [chainConfig],
  });
}

/**
 * Get currently connected Ethereum address
 * Tries persisted address first, then queries the wallet
 */
export async function getConnectedEthereumAddress(): Promise<`0x${string}` | null> {
  // Try persisted address first
  const persistedAddress = localStorage.getItem(ETH_ADDRESS_KEY);
  if (persistedAddress && persistedAddress.startsWith('0x')) {
    return persistedAddress as `0x${string}`;
  }
  
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    }) as string[];
    
    if (accounts && accounts.length > 0) {
      const address = accounts[0] as `0x${string}`;
      // Persist for future use
      localStorage.setItem(ETH_ADDRESS_KEY, address);
      return address;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if Ethereum wallet is connected
 */
export function isEthereumWalletConnected(): boolean {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  return localStorage.getItem(ETH_CONNECTED_KEY) === 'true';
}

/**
 * Disconnect Ethereum wallet (clears local state)
 * Note: This doesn't actually disconnect from MetaMask,
 * it just clears the app's connection state
 */
export function disconnectEthereumWallet(): void {
  localStorage.removeItem(ETH_CONNECTED_KEY);
  localStorage.removeItem(ETH_ADDRESS_KEY);
  localStorage.removeItem(ETH_WALLET_TYPE_KEY);
}

/**
 * Get current chain ID
 */
export async function getCurrentChainId(): Promise<number | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;
    
    return parseInt(chainId, 16);
  } catch {
    return null;
  }
}

// ============ Balance Fetching ============

/**
 * Fetch USDC balance for an Ethereum address
 */
export async function fetchUSDCBalance(
  address: `0x${string}`,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const publicClient = createEthereumPublicClient(network);
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  
  console.log(`Fetching USDC balance for ${address} on ${network}`);
  console.log(`USDC contract address: ${usdcAddress}`);
  
  try {
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    
    console.log(`USDC balance (raw): ${balance}`);
    return balance as bigint;
  } catch (error) {
    console.error('Failed to fetch USDC balance:', error);
    
    // Try alternative method using direct RPC call
    try {
      const response = await fetch(NETWORK_CONFIG[network].ethereum.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: usdcAddress,
            data: `0x70a08231000000000000000000000000${address.slice(2)}`, // balanceOf(address)
          }, 'latest'],
        }),
      });
      
      const data = await response.json();
      if (data.result) {
        const balance = BigInt(data.result);
        console.log(`USDC balance (fallback): ${balance}`);
        return balance;
      }
    } catch (fallbackError) {
      console.error('Fallback USDC balance fetch failed:', fallbackError);
    }
    
    return 0n;
  }
}

/**
 * Fetch native ETH balance
 */
export async function fetchETHBalance(
  address: `0x${string}`,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const publicClient = createEthereumPublicClient(network);
  
  try {
    return await publicClient.getBalance({ address });
  } catch (error) {
    console.error('Failed to fetch ETH balance:', error);
    return 0n;
  }
}

/**
 * Check USDC allowance for xReserve contract
 */
export async function checkUSDCAllowance(
  ownerAddress: `0x${string}`,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const publicClient = createEthereumPublicClient(network);
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  const xReserveAddress = CONTRACT_ADDRESSES[network].ethereum.xReserve as `0x${string}`;
  
  try {
    const allowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress, xReserveAddress],
    });
    
    return allowance as bigint;
  } catch (error) {
    console.error('Failed to check USDC allowance:', error);
    return 0n;
  }
}

// ============ Formatting Helpers ============

/**
 * Format USDC amount from micro units to display string
 */
export function formatUSDC(microAmount: bigint | number): string {
  const amount = typeof microAmount === 'bigint' ? microAmount : BigInt(microAmount);
  return formatUnits(amount, PROTOCOL_CONSTANTS.USDC_DECIMALS);
}

/**
 * Parse display amount to micro units
 */
export function parseUSDCAmount(displayAmount: string): bigint {
  return parseUnits(displayAmount, PROTOCOL_CONSTANTS.USDC_DECIMALS);
}

/**
 * Format ETH amount
 */
export function formatETH(weiAmount: bigint): string {
  return formatUnits(weiAmount, 18);
}

// ============ Gas Estimation ============

/**
 * Estimate gas price
 */
export async function getGasPrice(
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const publicClient = createEthereumPublicClient(network);
  
  try {
    return await publicClient.getGasPrice();
  } catch (error) {
    console.error('Failed to get gas price:', error);
    return 0n;
  }
}

/**
 * Estimate gas for approve transaction
 */
export async function estimateApproveGas(
  ownerAddress: `0x${string}`,
  amount: bigint,
  network: NetworkEnvironment = 'testnet'
): Promise<bigint> {
  const publicClient = createEthereumPublicClient(network);
  const usdcAddress = CONTRACT_ADDRESSES[network].ethereum.usdc as `0x${string}`;
  const xReserveAddress = CONTRACT_ADDRESSES[network].ethereum.xReserve as `0x${string}`;
  
  try {
    return await publicClient.estimateContractGas({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [xReserveAddress, amount],
      account: ownerAddress,
    });
  } catch (error) {
    console.error('Failed to estimate approve gas:', error);
    return 50000n; // Default estimate
  }
}

// ============ Type Augmentation for Window ============

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
