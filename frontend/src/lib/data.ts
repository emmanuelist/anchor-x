/**
 * Data Types and Constants
 * 
 * Type definitions and static data that doesn't change
 * Replaces mockData.ts with real data structures
 */

// Re-export formatting utilities
export { 
  formatAddress, 
  formatAmount, 
  formatCurrency, 
  formatCompactNumber,
  getTimeAgo,
  calculateBridgeFee,
  getExplorerUrl,
  getPercentageChange,
  formatMicroUnits,
  parseToMicroUnits,
  FEE_STRUCTURE,
  FEE_STRUCTURE as feeStructure,  // Backward compatibility alias
} from './utils/format';

// Re-export network services
export {
  fetchNetworkStatus,
  fetchBridgeStats,
  areNetworksHealthy,
  getBridgeStatus,
  type NetworkStatus,
  type BridgeStats,
} from './services/network';

// ============ Type Definitions ============

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
  status: 'pending' | 'confirming' | 'completed' | 'failed' | 'processing';
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

// ============ Initial States ============

export const initialWalletState: WalletState = {
  isConnected: false,
  ethereumAddress: null,
  stacksAddress: null,
  usdcBalance: 0,
  usdcxBalance: 0,
};

// ============ FAQ Data (Static Content) ============

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
    answer: 'Deposit transactions (Ethereum → Stacks) typically take 10-30 minutes, requiring Ethereum block confirmations for security. Withdrawal transactions (Stacks → Ethereum) take approximately 20-60 minutes, requiring Stacks block confirmations and attestation processing.',
  },
  {
    id: 'faq-4',
    category: 'bridging',
    question: 'Is there a minimum or maximum bridge amount?',
    answer: 'The minimum bridge amount is 1 USDC to ensure gas fees don\'t exceed the transfer value. There is no maximum limit, but transactions over $100,000 may require additional verification for compliance purposes.',
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
    answer: 'Yes, you need a wallet on both Ethereum (for USDC) and Stacks (for USDCx) to use the bridge. Connect both wallets to enable bridging in either direction.',
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
    answer: 'Ethereum gas fees are determined by network demand and the complexity of smart contract operations. Bridge transactions require multiple contract interactions (approval + deposit), which increases gas costs. We optimize our contracts to minimize fees where possible.',
  },
  {
    id: 'faq-9',
    category: 'security',
    question: 'How is the bridge secured?',
    answer: 'AnchorX uses Circle\'s xReserve protocol, which provides institutional-grade security. The protocol uses cryptographic attestations and multi-signature verification. All USDCx is backed 1:1 by real USDC held in Circle\'s reserves.',
  },
  {
    id: 'faq-10',
    category: 'security',
    question: 'What happens if a transaction fails?',
    answer: 'If a bridge transaction fails, your funds remain safe on the source chain. The transaction will either complete or revert entirely - you cannot lose funds mid-bridge. Failed deposits are automatically reverted on Ethereum.',
  },
];
