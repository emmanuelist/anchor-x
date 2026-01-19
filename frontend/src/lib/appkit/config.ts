/**
 * Reown AppKit Configuration
 * Beautiful wallet connection modal with WalletConnect support
 */

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sepolia, mainnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { http } from 'viem';

// Get project ID from environment or use demo project ID for development
// For production, get your own free project ID at https://cloud.reown.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// App metadata
const metadata = {
  name: 'AnchorX',
  description: 'Bridge USDC to Bitcoin\'s DeFi - The fastest way to bring USDC into the Stacks ecosystem',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://anchorx.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Network configuration - using Sepolia testnet as primary
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, mainnet];

// Configure wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: sepolia,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: true, // Enable email login
    socials: ['google', 'x', 'discord', 'github'], // Social logins
    emailShowWallets: true, // Show wallets even with email option
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-accent': '#8B5CF6', // Purple accent to match AnchorX theme
    '--w3m-color-mix': '#1a1625',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '12px',
  },
});

// Export wagmi config for use in providers
export const wagmiConfig = wagmiAdapter.wagmiConfig;
