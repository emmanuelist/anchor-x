/**
 * AnchorX Bridge Contract Constants
 * 
 * Contains all contract addresses, ABIs, and protocol constants
 * for both testnet and mainnet environments.
 */

// ============ Network Configuration ============

export type NetworkEnvironment = 'testnet' | 'mainnet';

export const NETWORK_CONFIG = {
  testnet: {
    stacks: {
      network: 'testnet' as const,
      apiUrl: 'https://api.testnet.hiro.so',
      explorerUrl: 'https://explorer.hiro.so/?chain=testnet',
    },
    ethereum: {
      chainId: 11155111, // Sepolia
      rpcUrl: 'https://ethereum-sepolia.publicnode.com',
      explorerUrl: 'https://sepolia.etherscan.io',
    },
  },
  mainnet: {
    stacks: {
      network: 'mainnet' as const,
      apiUrl: 'https://api.mainnet.hiro.so',
      explorerUrl: 'https://explorer.hiro.so',
    },
    ethereum: {
      chainId: 1,
      rpcUrl: 'https://ethereum.publicnode.com',
      explorerUrl: 'https://etherscan.io',
    },
  },
} as const;

// ============ Protocol Constants ============

export const PROTOCOL_CONSTANTS = {
  // Circle xReserve domain ID for Stacks
  STACKS_DOMAIN_ID: 10003,
  
  // Ethereum domain ID for withdrawals
  ETHEREUM_NATIVE_DOMAIN: 0,
  
  // USDC decimals (same for USDC and USDCx)
  USDC_DECIMALS: 6,
  
  // Bridge limits
  MIN_BRIDGE_AMOUNT: 1_000_000, // 1 USDC in micro units
  MAX_BRIDGE_AMOUNT: 1_000_000_000_000, // 1M USDC in micro units
  
  // Estimated bridge time in minutes
  ESTIMATED_BRIDGE_TIME_MINUTES: 15,
  
  // Required confirmations
  ETHEREUM_CONFIRMATIONS: 12,
  STACKS_CONFIRMATIONS: 6,
} as const;

// ============ Contract Addresses ============

export const CONTRACT_ADDRESSES = {
  testnet: {
    ethereum: {
      // Circle xReserve contract on Sepolia
      xReserve: '0x008888878f94C0d87defdf0B07f46B93C1934442',
      // USDC token on Sepolia
      usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
    stacks: {
      // USDCx token contract deployer on testnet
      // From: https://docs.stacks.co/learn/bridging/usdcx/contracts
      deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      // USDCx token contract name
      usdcxToken: 'usdcx',
      // USDCx-v1 bridge contract name (entrypoint)
      usdcxV1: 'usdcx-v1',
    },
  },
  mainnet: {
    ethereum: {
      // Circle xReserve contract on Ethereum mainnet
      xReserve: '0x8888888199b2Df864bf6782596607d6D5EBb4e3Ce',
      // USDC token on Ethereum mainnet
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    stacks: {
      // USDCx token contract deployer on mainnet
      // From: https://docs.stacks.co/learn/bridging/usdcx/contracts
      deployer: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
      // USDCx token contract name
      usdcxToken: 'usdcx',
      // USDCx-v1 bridge contract name (entrypoint)
      usdcxV1: 'usdcx-v1',
    },
  },
} as const;

// ============ Helper Functions ============

/**
 * Get full Stacks contract identifier
 */
export function getStacksContractId(
  network: NetworkEnvironment,
  contractName: 'usdcxToken' | 'usdcxV1'
): string {
  const addresses = CONTRACT_ADDRESSES[network].stacks;
  return `${addresses.deployer}.${addresses[contractName]}`;
}

/**
 * Get Ethereum contract address with 0x prefix
 */
export function getEthereumContractAddress(
  network: NetworkEnvironment,
  contractName: 'xReserve' | 'usdc'
): `0x${string}` {
  const address = CONTRACT_ADDRESSES[network].ethereum[contractName];
  return address.startsWith('0x') ? address as `0x${string}` : `0x${address}`;
}

// ============ Contract ABIs ============

/**
 * Circle xReserve ABI (minimal - only functions we need)
 */
export const X_RESERVE_ABI = [
  {
    name: 'depositToRemote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'value', type: 'uint256' },
      { name: 'remoteDomain', type: 'uint32' },
      { name: 'remoteRecipient', type: 'bytes32' },
      { name: 'localToken', type: 'address' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

/**
 * ERC-20 ABI (minimal - only functions we need)
 */
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'string' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

// ============ Explorer URL Helpers ============

export function getStacksExplorerTxUrl(txId: string, network: NetworkEnvironment): string {
  const baseUrl = NETWORK_CONFIG[network].stacks.explorerUrl;
  const chainParam = network === 'testnet' ? '&chain=testnet' : '';
  return `${baseUrl}/txid/${txId}?${chainParam}`;
}

export function getEthereumExplorerTxUrl(txHash: string, network: NetworkEnvironment): string {
  const baseUrl = NETWORK_CONFIG[network].ethereum.explorerUrl;
  return `${baseUrl}/tx/${txHash}`;
}

export function getStacksExplorerAddressUrl(address: string, network: NetworkEnvironment): string {
  const baseUrl = NETWORK_CONFIG[network].stacks.explorerUrl;
  const chainParam = network === 'testnet' ? '?chain=testnet' : '';
  return `${baseUrl}/address/${address}${chainParam}`;
}

export function getEthereumExplorerAddressUrl(address: string, network: NetworkEnvironment): string {
  const baseUrl = NETWORK_CONFIG[network].ethereum.explorerUrl;
  return `${baseUrl}/address/${address}`;
}
