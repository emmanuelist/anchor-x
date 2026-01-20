/**
 * Wallet Selection Modal
 * Beautiful modal for selecting Ethereum and Stacks wallets
 * Uses inline SVG icons for reliability
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import stacksLogo from '@/assets/stacks-logo.jpg';

// Inline SVG wallet icons for reliability (no external loading)
const WalletIcons: Record<string, JSX.Element> = {
  metamask: (
    <svg viewBox="0 0 35 33" className="w-7 h-7">
      <g fill="none" fillRule="evenodd">
        <path d="M32.96 1l-13.13 9.72 2.43-5.73L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.66 1l13 9.81-2.32-5.81L2.66 1zM28.23 23.53l-3.5 5.35 7.49 2.06 2.15-7.3-6.14-.11zM.88 23.64l2.14 7.3 7.49-2.06-3.5-5.35-6.13.11z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.18 14.51l-2.1 3.17 7.47.34-.26-8.04-5.11 4.53zM25.46 14.51l-5.18-4.62-.17 8.13 7.46-.34-2.11-3.17zM10.51 28.88l4.49-2.19-3.88-3.03-.61 5.22zM20.64 26.69l4.49 2.19-.62-5.22-3.87 3.03z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M25.13 28.88l-4.49-2.19.36 2.94-.04 1.24 4.17-2zM10.51 28.88l4.16 2-.03-1.24.36-2.94-4.49 2.18z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.77 21.79l-3.74-1.1 2.64-1.21 1.1 2.31zM20.87 21.79l1.1-2.31 2.65 1.21-3.75 1.1z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.51 28.88l.64-5.35-4.14.12 3.5 5.23zM24.49 23.53l.64 5.35 3.5-5.23-4.14-.12zM27.57 17.68l-7.46.34.69 3.77 1.1-2.31 2.65 1.21 3.02-3.01zM11.03 20.69l2.65-1.21 1.1 2.31.69-3.77-7.47-.34 3.03 3.01z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 17.68l3.15 6.14-.1-3.04L8 17.68zM24.55 20.78l-.11 3.04 3.13-6.14-3.02 3.1zM15.47 18.02l-.69 3.77.87 4.5.19-5.93-.37-2.34zM20.11 18.02l-.36 2.33.18 5.94.87-4.5-.69-3.77z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.8 21.79l-.87 4.5.62.44 3.87-3.03.11-3.04-3.73 1.13zM11.03 20.66l.1 3.04 3.88 3.03.62-.44-.87-4.5-3.73-1.13z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.84 28.88l.04-1.24-.34-.29h-5.44l-.33.29.03 1.24-4.16-2 1.46 1.19 2.95 2.04h5.53l2.96-2.04 1.46-1.19-4.16 2z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.64 26.69l-.62-.44h-4.4l-.62.44-.36 2.94.33-.29h5.44l.34.29-.11-2.94z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M33.52 11.35l1.11-5.36L32.96 1l-12.32 9.14 4.74 4.01 6.7 1.95 1.47-1.72-.64-.46 1.02-.93-.79-.61 1.02-.77-.67-.51zM.01 5.99l1.11 5.36-.71.52 1.02.77-.78.61 1.02.93-.64.46 1.47 1.72 6.7-1.95 4.74-4.01L2.66 1 .01 5.99z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32.18 16.14l-6.7-1.95 2.02 3.04-3.13 6.14 4.13-.05h6.18l-2.5-7.18zM10.18 14.19l-6.7 1.95-2.49 7.18h6.17l4.13.05-3.13-6.14 2.02-3.04zM20.11 18.02l.43-7.41 1.95-5.28H13.15l1.94 5.28.43 7.41.17 2.35.01 5.92h4.4l.02-5.92.16-2.35z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  ),
  coinbase: (
    <svg viewBox="0 0 1024 1024" className="w-7 h-7">
      <circle cx="512" cy="512" r="512" fill="#0052FF"/>
      <path d="M516.3 361.83c60.28 0 108.1 37.18 126.26 92.47H764C742 358 642.37 288 516.3 288 347.1 288 212 423.1 212 592.3c0 169.2 135.1 304.3 304.3 304.3 126.07 0 225.7-70 247.86-165.3H642.56c-18.16 55.3-65.98 92.47-126.26 92.47-85.47 0-152.5-67.02-152.5-152.5 0-85.47 67.03-152.5 152.5-152.5z" fill="#fff"/>
    </svg>
  ),
  trust: (
    <svg viewBox="0 0 1024 1024" className="w-7 h-7">
      <circle cx="512" cy="512" r="512" fill="#0500FF"/>
      <path d="M512 219L307 298v278c0 159 205 262 205 262s205-103 205-262V298L512 219zm0 72l154 59v213c0 114-154 188-154 188s-154-74-154-188V350l154-59z" fill="#fff"/>
    </svg>
  ),
  rabby: (
    <svg viewBox="0 0 200 200" className="w-7 h-7">
      <defs>
        <linearGradient id="rabby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8697FF"/>
          <stop offset="100%" stopColor="#6E7BFF"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#rabby-grad)"/>
      <ellipse cx="70" cy="85" rx="20" ry="25" fill="#fff"/>
      <ellipse cx="130" cy="85" rx="20" ry="25" fill="#fff"/>
      <circle cx="70" cy="90" r="8" fill="#000"/>
      <circle cx="130" cy="90" r="8" fill="#000"/>
      <path d="M60 130 Q100 160 140 130" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  brave: (
    <svg viewBox="0 0 256 301" className="w-7 h-7">
      <defs>
        <linearGradient id="brave-a" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#F1562B"/>
          <stop offset="41%" stopColor="#F1562B"/>
          <stop offset="100%" stopColor="#B33624"/>
        </linearGradient>
        <linearGradient id="brave-b" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FB7444"/>
          <stop offset="100%" stopColor="#F1562B"/>
        </linearGradient>
      </defs>
      <path fill="url(#brave-a)" d="M235.6 75.2L252 45.5l-23.2-9.1c.1-.6-3.3-9.1-3.3-9.1l-18.8 3.4L188 4.2c-7-5.6-15.4-5.6-15.4-5.6h-89c0 0-8.4 0-15.4 5.6L49.5 30.7l-18.8-3.4s-3.4 8.5-3.3 9.1L4 45.5l16.4 29.7L3.8 98.4 51.6 251l30.9 35.5c16.1 14.1 29.8 14.1 29.8 14.1h31.4s13.7 0 29.8-14.1l30.9-35.5 47.8-152.6-17.6-23.2z"/>
      <path fill="url(#brave-b)" d="M128 23.8L83.6 78l44.4 134.5L172.4 78 128 23.8z"/>
      <path fill="#FF7A1A" d="M128 212.5l-44.4-134.5L128 23.8l44.4 54.2L128 212.5z"/>
    </svg>
  ),
  okx: (
    <svg viewBox="0 0 200 200" className="w-7 h-7">
      <rect width="200" height="200" rx="40" fill="#000"/>
      <g fill="#fff">
        <rect x="30" y="30" width="40" height="40" rx="4"/>
        <rect x="80" y="30" width="40" height="40" rx="4"/>
        <rect x="130" y="30" width="40" height="40" rx="4"/>
        <rect x="30" y="80" width="40" height="40" rx="4"/>
        <rect x="130" y="80" width="40" height="40" rx="4"/>
        <rect x="30" y="130" width="40" height="40" rx="4"/>
        <rect x="80" y="130" width="40" height="40" rx="4"/>
        <rect x="130" y="130" width="40" height="40" rx="4"/>
      </g>
    </svg>
  ),
  leather: (
    <img 
      src="https://lh3.googleusercontent.com/L2-6RY-R0J7MfguWZugMMEupyf60d9nY7tGT-vdJbKuxIVEEh0Kqu-5_G61hC47N5klx0p9196JCmS81dmJOA5OTIw=s120" 
      alt="Leather Wallet"
      className="w-7 h-7 rounded-lg"
    />
  ),
  xverse: (
    <img 
      src="https://lh3.googleusercontent.com/Y-j4EbvbfD7pGCDm2hL_GLKk9zFhQs5Byr38Kyeq0OYmjbvt6HR-jsv1g4UBUdSLUGZ6eb-doYpxkk8BjS_ASBF3lA=s120" 
      alt="Xverse Wallet"
      className="w-7 h-7 rounded-lg"
    />
  ),
};

// Wallet definitions
export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed?: boolean;
  popular?: boolean;
  downloadUrl?: string;
}

const ETHEREUM_WALLETS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'metamask',
    description: 'Connect using MetaMask browser extension',
    popular: true,
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: 'okx',
    description: 'Connect using OKX Wallet',
    popular: true,
    downloadUrl: 'https://www.okx.com/web3',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'coinbase',
    description: 'Connect using Coinbase Wallet',
    popular: true,
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    icon: 'rabby',
    description: 'Connect using Rabby Wallet',
    downloadUrl: 'https://rabby.io/',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'trust',
    description: 'Connect using Trust Wallet',
    downloadUrl: 'https://trustwallet.com/',
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    icon: 'brave',
    description: 'Connect using Brave browser wallet',
    downloadUrl: 'https://brave.com/wallet/',
  },
];

const STACKS_WALLETS: WalletOption[] = [
  {
    id: 'leather',
    name: 'Leather',
    icon: 'leather',
    description: 'Connect using Leather wallet (formerly Hiro)',
    popular: true,
    downloadUrl: 'https://leather.io/',
  },
  {
    id: 'xverse',
    name: 'Xverse',
    icon: 'xverse',
    description: 'Connect using Xverse wallet',
    popular: true,
    downloadUrl: 'https://www.xverse.app/',
  },
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: string) => Promise<void>;
  chain: 'ethereum' | 'stacks';
  title?: string;
}

export function WalletModal({
  isOpen,
  onClose,
  onSelectWallet,
  chain,
  title,
}: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installedWallets, setInstalledWallets] = useState<Set<string>>(new Set());

  const wallets = chain === 'ethereum' ? ETHEREUM_WALLETS : STACKS_WALLETS;

  // Detect installed wallets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const installed = new Set<string>();

    // Check Ethereum wallets
    if (chain === 'ethereum') {
      const ethereum = window.ethereum as any;
      const okxWallet = (window as any).okxwallet;
      
      // Check for OKX wallet (has its own global)
      if (okxWallet) {
        installed.add('okx');
      }

      if (ethereum) {
        // Handle single provider
        if (ethereum.isMetaMask && !ethereum.isBraveWallet && !ethereum.isRabby && !ethereum.isOkxWallet) {
          installed.add('metamask');
        }
        if (ethereum.isCoinbaseWallet) installed.add('coinbase');
        if (ethereum.isTrust) installed.add('trust');
        if (ethereum.isRabby) installed.add('rabby');
        if (ethereum.isBraveWallet) installed.add('brave');
        if (ethereum.isOkxWallet || ethereum.isOKExWallet) installed.add('okx');
        
        // Handle multiple providers (when multiple wallets installed)
        if (ethereum.providers && Array.isArray(ethereum.providers)) {
          ethereum.providers.forEach((provider: any) => {
            if (provider.isMetaMask && !provider.isBraveWallet && !provider.isRabby && !provider.isOkxWallet) {
              installed.add('metamask');
            }
            if (provider.isCoinbaseWallet) installed.add('coinbase');
            if (provider.isTrust) installed.add('trust');
            if (provider.isRabby) installed.add('rabby');
            if (provider.isBraveWallet) installed.add('brave');
            if (provider.isOkxWallet || provider.isOKExWallet) installed.add('okx');
          });
        }
      }
    }

    // Check Stacks wallets
    if (chain === 'stacks') {
      if ((window as any).LeatherProvider || (window as any).HiroWalletProvider) {
        installed.add('leather');
      }
      if ((window as any).XverseProviders || (window as any).btc) {
        installed.add('xverse');
      }
    }

    setInstalledWallets(installed);
  }, [chain, isOpen]);

  const handleSelectWallet = async (wallet: WalletOption) => {
    // If not installed, open download page
    if (!installedWallets.has(wallet.id) && wallet.downloadUrl) {
      window.open(wallet.downloadUrl, '_blank');
      return;
    }

    setConnecting(wallet.id);
    setError(null);

    try {
      await onSelectWallet(wallet.id);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const modalTitle = title || (chain === 'ethereum' ? 'Connect Ethereum Wallet' : 'Connect Stacks Wallet');

  // Sort wallets: installed first, then by order in array
  const sortedWallets = [...wallets].sort((a, b) => {
    const aInstalled = installedWallets.has(a.id) ? 1 : 0;
    const bInstalled = installedWallets.has(b.id) ? 1 : 0;
    return bInstalled - aInstalled;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface-1 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {chain === 'ethereum' ? (
              <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center">
                <svg viewBox="0 0 256 417" className="w-3.5 h-3.5">
                  <path fill="#fff" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
                  <path fill="#fff" opacity="0.6" d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
                </svg>
              </div>
            ) : (
              <img 
                src={stacksLogo} 
                alt="Stacks" 
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a wallet to connect to AnchorX
          </DialogDescription>
        </DialogHeader>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet list - separated by installed status */}
        <div className="space-y-4 mt-2">
          {/* Installed Wallets Section */}
          {sortedWallets.some(w => installedWallets.has(w.id)) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">
                  Installed — Click to Connect
                </span>
              </div>
              {sortedWallets
                .filter(wallet => installedWallets.has(wallet.id))
                .map((wallet) => {
                  const isConnecting = connecting === wallet.id;
                  const WalletIcon = WalletIcons[wallet.icon];

                  return (
                    <motion.button
                      key={wallet.id}
                      onClick={() => handleSelectWallet(wallet)}
                      disabled={isConnecting}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                        'border-2 border-green-500/40 hover:border-green-500',
                        'bg-green-500/5 hover:bg-green-500/10',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
                        isConnecting && 'border-primary bg-primary/5'
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Wallet icon */}
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {WalletIcon}
                      </div>

                      {/* Wallet info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{wallet.name}</span>
                          {wallet.popular && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-green-400/80 mt-0.5">
                          Ready to connect
                        </p>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0">
                        {isConnecting ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <div className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                            Connect
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          )}

          {/* Not Installed Section */}
          {sortedWallets.some(w => !installedWallets.has(w.id)) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Other Wallets — Install
                </span>
              </div>
              {sortedWallets
                .filter(wallet => !installedWallets.has(wallet.id))
                .map((wallet) => {
                  const WalletIcon = WalletIcons[wallet.icon];

                  return (
                    <motion.button
                      key={wallet.id}
                      onClick={() => handleSelectWallet(wallet)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                        'border border-border/50 hover:border-border',
                        'bg-surface-2/50 hover:bg-surface-2',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Wallet icon */}
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 p-1 opacity-60">
                        {WalletIcon}
                      </div>

                      {/* Wallet info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground/70">{wallet.name}</span>
                          {wallet.popular && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary/60">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Install {wallet.name}
                        </p>
                      </div>

                      {/* Install link */}
                      <div className="shrink-0">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            By connecting a wallet, you agree to AnchorX's{' '}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ETHEREUM_WALLETS, STACKS_WALLETS };
