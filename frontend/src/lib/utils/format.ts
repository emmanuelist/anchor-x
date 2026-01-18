/**
 * Formatting Utilities
 * 
 * Pure utility functions for formatting data display
 * These don't depend on any mock data
 */

// Fee structure constants (real values from the protocol)
// Note: minBridgeFee set low for testnet small amounts
export const FEE_STRUCTURE = {
  bridgeFeePercent: 0.25, // 0.25%
  minBridgeFee: 0.01, // $0.01 minimum for testnet (mainnet would be higher)
  estimatedGasFee: {
    ethereum: 0.50, // Estimated gas in USD (varies with network conditions)
    stacks: 0.01,
  },
} as const;

/**
 * Format a wallet address with ellipsis
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a number with commas and decimals
 */
export function formatAmount(amount: number | bigint, decimals = 2): string {
  const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);
}

/**
 * Format as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large numbers compactly (e.g., 1.2M)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Format a date as relative time (e.g., "5m ago")
 */
export function getTimeAgo(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return dateObj.toLocaleDateString();
}

/**
 * Calculate bridge fee based on amount
 */
export function calculateBridgeFee(amount: number): number {
  const percentageFee = amount * (FEE_STRUCTURE.bridgeFeePercent / 100);
  return Math.max(percentageFee, FEE_STRUCTURE.minBridgeFee);
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(
  chain: 'ethereum' | 'stacks', 
  txHash: string, 
  network: 'mainnet' | 'testnet' = 'testnet'
): string {
  if (chain === 'ethereum') {
    const baseUrl = network === 'mainnet' 
      ? 'https://etherscan.io' 
      : 'https://sepolia.etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  }
  const baseUrl = network === 'mainnet'
    ? 'https://explorer.stacks.co'
    : 'https://explorer.hiro.so';
  return `${baseUrl}/txid/${txHash}?chain=${network}`;
}

/**
 * Calculate percentage change between two values
 */
export function getPercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format micro units (6 decimals) to display
 */
export function formatMicroUnits(microUnits: bigint | number, decimals = 2): string {
  const num = typeof microUnits === 'bigint' ? Number(microUnits) : microUnits;
  return formatAmount(num / 1_000_000, decimals);
}

/**
 * Parse display amount to micro units
 */
export function parseToMicroUnits(displayAmount: string | number): bigint {
  const num = typeof displayAmount === 'string' ? parseFloat(displayAmount) : displayAmount;
  return BigInt(Math.floor(num * 1_000_000));
}
