// Mock Data for AnchorX Bridge

export interface TransactionStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  timestamp?: Date;
  details?: string;
  blockNumber?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  fromChain: 'ethereum' | 'stacks';
  toChain: 'ethereum' | 'stacks';
  fromAddress: string;
  toAddress: string;
  txHash: string;
  destinationTxHash?: string;
  timestamp: Date;
  confirmations: number;
  requiredConfirmations: number;
  fee: number;
  gasFee: number;
}

export interface WalletState {
  isConnected: boolean;
  ethereumAddress: string | null;
  stacksAddress: string | null;
  usdcBalance: number;
  usdcxBalance: number;
}

// Mock wallet addresses
export const MOCK_ETH_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f8bC91';
export const MOCK_STX_ADDRESS = 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B';

// Initial wallet state (disconnected)
export const initialWalletState: WalletState = {
  isConnected: false,
  ethereumAddress: null,
  stacksAddress: null,
  usdcBalance: 0,
  usdcxBalance: 0,
};

// Connected wallet state
export const connectedWalletState: WalletState = {
  isConnected: true,
  ethereumAddress: MOCK_ETH_ADDRESS,
  stacksAddress: MOCK_STX_ADDRESS,
  usdcBalance: 5432.50,
  usdcxBalance: 1234.00,
};

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    type: 'deposit',
    amount: 1000.00,
    status: 'completed',
    fromChain: 'ethereum',
    toChain: 'stacks',
    fromAddress: MOCK_ETH_ADDRESS,
    toAddress: MOCK_STX_ADDRESS,
    txHash: '0x8f4d2c1a3b5e6f7d8c9b0a1e2f3d4c5b6a7e8f9d0c1b2a3e4f5d6c7b8a9e0f1',
    destinationTxHash: 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B.tx001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    confirmations: 12,
    requiredConfirmations: 12,
    fee: 2.50,
    gasFee: 5.20,
  },
  {
    id: 'tx-002',
    type: 'withdraw',
    amount: 500.00,
    status: 'completed',
    fromChain: 'stacks',
    toChain: 'ethereum',
    fromAddress: MOCK_STX_ADDRESS,
    toAddress: MOCK_ETH_ADDRESS,
    txHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    destinationTxHash: '0xd2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    confirmations: 6,
    requiredConfirmations: 6,
    fee: 1.25,
    gasFee: 3.80,
  },
  {
    id: 'tx-003',
    type: 'deposit',
    amount: 2500.00,
    status: 'confirming',
    fromChain: 'ethereum',
    toChain: 'stacks',
    fromAddress: MOCK_ETH_ADDRESS,
    toAddress: MOCK_STX_ADDRESS,
    txHash: '0xf1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    confirmations: 8,
    requiredConfirmations: 12,
    fee: 6.25,
    gasFee: 8.50,
  },
  {
    id: 'tx-004',
    type: 'deposit',
    amount: 150.00,
    status: 'pending',
    fromChain: 'ethereum',
    toChain: 'stacks',
    fromAddress: MOCK_ETH_ADDRESS,
    toAddress: MOCK_STX_ADDRESS,
    txHash: '0xb1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    confirmations: 0,
    requiredConfirmations: 12,
    fee: 0.38,
    gasFee: 4.20,
  },
  {
    id: 'tx-005',
    type: 'withdraw',
    amount: 750.00,
    status: 'failed',
    fromChain: 'stacks',
    toChain: 'ethereum',
    fromAddress: MOCK_STX_ADDRESS,
    toAddress: MOCK_ETH_ADDRESS,
    txHash: '0xc1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    confirmations: 0,
    requiredConfirmations: 6,
    fee: 1.88,
    gasFee: 0,
  },
  {
    id: 'tx-006',
    type: 'deposit',
    amount: 3200.00,
    status: 'completed',
    fromChain: 'ethereum',
    toChain: 'stacks',
    fromAddress: '0x1234567890abcdef1234567890abcdef12345678',
    toAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    txHash: '0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
    destinationTxHash: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.tx006',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (for live feed)
    confirmations: 12,
    requiredConfirmations: 12,
    fee: 8.00,
    gasFee: 12.30,
  },
  {
    id: 'tx-007',
    type: 'withdraw',
    amount: 890.00,
    status: 'completed',
    fromChain: 'stacks',
    toChain: 'ethereum',
    fromAddress: 'SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS',
    toAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    txHash: '0xe1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    destinationTxHash: '0xf2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
    timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    confirmations: 6,
    requiredConfirmations: 6,
    fee: 2.23,
    gasFee: 4.50,
  },
];

// Stats for the landing page
export const bridgeStats = {
  totalValueBridged: 47_832_450,
  totalTransactions: 12_847,
  avgBridgeTime: 12, // minutes
  activeUsers: 3_421,
};

// Network status
export interface NetworkStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number; // ms
  blockHeight: number;
  lastUpdate: Date;
}

export const networkStatus: NetworkStatus[] = [
  {
    name: 'Ethereum',
    status: 'operational',
    latency: 45,
    blockHeight: 19_234_567,
    lastUpdate: new Date(),
  },
  {
    name: 'Stacks',
    status: 'operational',
    latency: 120,
    blockHeight: 156_789,
    lastUpdate: new Date(),
  },
  {
    name: 'xReserve',
    status: 'operational',
    latency: 30,
    blockHeight: 0,
    lastUpdate: new Date(),
  },
];

// Fee structure
export const feeStructure = {
  bridgeFeePercent: 0.25, // 0.25%
  minBridgeFee: 1.00,
  estimatedGasFee: {
    ethereum: 5.50,
    stacks: 0.10,
  },
};

// Sparkline data for dashboard
export const sparklineData = {
  usdc: [5200, 5100, 5350, 5280, 5400, 5320, 5432],
  usdcx: [1100, 1150, 1080, 1200, 1180, 1250, 1234],
  total: [6300, 6250, 6430, 6480, 6580, 6570, 6666],
};

// Calculate percentage change
export function getPercentageChange(data: number[]): number {
  if (data.length < 2) return 0;
  const first = data[0];
  const last = data[data.length - 1];
  return ((last - first) / first) * 100;
}

// FAQ data
export interface FAQItem {
  id: string;
  category: 'getting-started' | 'bridging' | 'wallets' | 'fees' | 'security';
  question: string;
  answer: string;
}

export const faqData: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'getting-started',
    question: 'What is AnchorX?',
    answer: 'AnchorX is a cross-chain bridge that allows you to seamlessly transfer USDC between Ethereum and the Stacks blockchain, enabling you to participate in Bitcoin\'s DeFi ecosystem while maintaining the stability and familiarity of USDC.',
  },
  {
    id: 'faq-2',
    category: 'getting-started',
    question: 'What is USDCx?',
    answer: 'USDCx is the wrapped version of USDC on the Stacks blockchain. It\'s a 1:1 representation of your USDC, backed by real USDC held in secure reserves managed by Circle. USDCx can be used in Stacks DeFi protocols and can be bridged back to Ethereum at any time.',
  },
  {
    id: 'faq-3',
    category: 'bridging',
    question: 'How long does a bridge transaction take?',
    answer: 'Deposit transactions (Ethereum → Stacks) typically take 10-15 minutes, requiring 12 Ethereum block confirmations for security. Withdrawal transactions (Stacks → Ethereum) take approximately 5-10 minutes, requiring 6 Stacks block confirmations.',
  },
  {
    id: 'faq-4',
    category: 'bridging',
    question: 'Is there a minimum or maximum bridge amount?',
    answer: 'The minimum bridge amount is 10 USDC to ensure gas fees don\'t exceed the transfer value. There is no maximum limit, but transactions over $100,000 may require additional verification for compliance purposes.',
  },
  {
    id: 'faq-5',
    category: 'wallets',
    question: 'Which wallets are supported?',
    answer: 'For Ethereum, we support MetaMask, WalletConnect, Coinbase Wallet, and most EVM-compatible wallets. For Stacks, we support Leather (formerly Hiro Wallet), Xverse, and other Stacks-compatible wallets.',
  },
  {
    id: 'faq-6',
    category: 'wallets',
    question: 'Do I need wallets on both chains?',
    answer: 'Yes, you need a wallet on both Ethereum (for USDC) and Stacks (for USDCx) to use the bridge. You can use the same seed phrase with compatible wallet software on both chains if desired.',
  },
  {
    id: 'faq-7',
    category: 'fees',
    question: 'What are the bridge fees?',
    answer: 'AnchorX charges a 0.25% bridge fee with a minimum of $1.00 per transaction. Additionally, you\'ll pay network gas fees on the source chain (Ethereum or Stacks). All fees are clearly displayed before you confirm any transaction.',
  },
  {
    id: 'faq-8',
    category: 'fees',
    question: 'Why are Ethereum gas fees higher?',
    answer: 'Ethereum gas fees are determined by network demand and the complexity of smart contract operations. Bridge transactions require multiple contract interactions, which increases gas costs. We optimize our contracts to minimize fees where possible.',
  },
  {
    id: 'faq-9',
    category: 'security',
    question: 'How is the bridge secured?',
    answer: 'AnchorX uses a multi-signature custody system with institutional-grade security. All smart contracts are audited by leading security firms. The xReserve backing USDCx is held in segregated accounts with real-time proof of reserves available.',
  },
  {
    id: 'faq-10',
    category: 'security',
    question: 'What happens if a transaction fails?',
    answer: 'If a bridge transaction fails, your funds remain safe on the source chain. Failed deposits are automatically refunded within 24 hours. For any issues, our support team is available 24/7 to assist with transaction recovery.',
  },
];

// Helper functions
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function formatAmount(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function calculateBridgeFee(amount: number): number {
  const percentageFee = amount * (feeStructure.bridgeFeePercent / 100);
  return Math.max(percentageFee, feeStructure.minBridgeFee);
}

export function getExplorerUrl(chain: 'ethereum' | 'stacks', txHash: string): string {
  if (chain === 'ethereum') {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return `https://explorer.stacks.co/txid/${txHash}`;
}
