import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress, formatAmount } from '@/lib/data';
import { Wallet, LogOut, Menu, X, ChevronDown, Circle, Copy, Check, ExternalLink } from 'lucide-react';
import { useState, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChainIcon } from '@/components/ui/ChainIcon';
import { TokenIcon } from '@/components/ui/TokenIcon';
import type { NetworkEnvironment } from '@/lib/constants/contracts';

// Primary links shown directly in tablet nav
const primaryLinks = [
  { path: '/', label: 'Home' },
  { path: '/bridge', label: 'Bridge' },
  { path: '/transfer', label: 'Transfer' },
  { path: '/dashboard', label: 'Dashboard' },
];

// Secondary links shown in "More" dropdown on tablet
const secondaryLinks = [
  { path: '/how-it-works', label: 'How It Works' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/faq', label: 'FAQ' },
];

// All links for desktop and mobile
const navLinks = [...primaryLinks, ...secondaryLinks];

// Memoized wallet dropdown to prevent infinite update loops from Radix UI
interface WalletDropdownProps {
  ethereumAddress: string | null;
  stacksAddress: string | null;
  usdcBalance: number;
  usdcxBalance: number;
  network: NetworkEnvironment;
  onDisconnect: () => void;
}

const WalletDropdown = memo(function WalletDropdown({
  ethereumAddress,
  stacksAddress,
  usdcBalance,
  usdcxBalance,
  network,
  onDisconnect,
}: WalletDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  }, []);

  const getExplorerUrl = useCallback((chain: 'ethereum' | 'stacks', address: string) => {
    if (chain === 'ethereum') {
      return network === 'mainnet' 
        ? `https://etherscan.io/address/${address}`
        : `https://sepolia.etherscan.io/address/${address}`;
    }
    return network === 'mainnet'
      ? `https://explorer.hiro.so/address/${address}`
      : `https://explorer.hiro.so/address/${address}?chain=testnet`;
  }, [network]);

  const handleDisconnect = useCallback(() => {
    onDisconnect();
    setIsOpen(false);
  }, [onDisconnect]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hidden sm:flex items-center gap-2 glass px-3 py-2 h-auto hover:bg-muted/50"
        >
          {/* Network Badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            network === 'mainnet' 
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          )}>
            {network}
          </span>
          
          {/* Wallet Icons */}
          <div className="flex -space-x-1">
            {ethereumAddress && (
              <div className="h-6 w-6 rounded-full bg-ethereum/20 border-2 border-background flex items-center justify-center">
                <ChainIcon chain="ethereum" className="h-3.5 w-3.5" />
              </div>
            )}
            {stacksAddress && (
              <div className="h-6 w-6 rounded-full bg-stacks/20 border-2 border-background flex items-center justify-center">
                <ChainIcon chain="stacks" className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-popover/95 backdrop-blur-xl border-border">
        {/* Network Header */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Network</span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
              network === 'mainnet' 
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            )}>
              <Circle className={cn(
                "h-2 w-2 fill-current",
                network === 'mainnet' ? "text-green-400" : "text-yellow-400"
              )} />
              {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </span>
          </div>
        </div>

        {/* Ethereum Wallet */}
        {ethereumAddress && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-ethereum/20 flex items-center justify-center">
                <ChainIcon chain="ethereum" className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Ethereum</div>
                <div className="text-xs text-muted-foreground">
                  {network === 'mainnet' ? 'Mainnet' : 'Sepolia'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-surface-1 rounded-lg px-3 py-2 mb-2">
              <span className="font-mono text-sm">{formatAddress(ethereumAddress, 6, 4)}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(ethereumAddress)}
                >
                  {copiedAddress === ethereumAddress ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <a
                  href={getExplorerUrl('ethereum', ethereumAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TokenIcon token="USDC" className="h-5 w-5" />
                <span className="text-sm text-muted-foreground">USDC Balance</span>
              </div>
              <span className="font-semibold">${formatAmount(usdcBalance)}</span>
            </div>
          </div>
        )}

        {/* Stacks Wallet */}
        {stacksAddress && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-stacks/20 flex items-center justify-center">
                <ChainIcon chain="stacks" className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Stacks</div>
                <div className="text-xs text-muted-foreground">
                  {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-surface-1 rounded-lg px-3 py-2 mb-2">
              <span className="font-mono text-sm">{formatAddress(stacksAddress, 6, 4)}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(stacksAddress)}
                >
                  {copiedAddress === stacksAddress ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <a
                  href={getExplorerUrl('stacks', stacksAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TokenIcon token="USDCx" className="h-5 w-5" />
                <span className="text-sm text-muted-foreground">USDCx Balance</span>
              </div>
              <span className="font-semibold">${formatAmount(usdcxBalance)}</span>
            </div>
          </div>
        )}

        {/* Total Balance */}
        <div className="px-4 py-3 border-b border-border/50 bg-surface-1/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Balance</span>
            <span className="font-bold text-lg">${formatAmount(usdcBalance + usdcxBalance)}</span>
          </div>
        </div>

        {/* Disconnect Button */}
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect Wallets
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Memoized "More" dropdown to prevent infinite update loops
interface MoreDropdownProps {
  currentPath: string;
}

const MoreDropdown = memo(function MoreDropdown({ currentPath }: MoreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSecondaryActive = secondaryLinks.some(link => link.path === currentPath);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'px-3 py-2 text-sm font-medium transition-all duration-200',
            isSecondaryActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            isOpen && 'text-foreground bg-muted/50 shadow-glow-sm ring-1 ring-primary/30'
          )}
        >
          More
          <ChevronDown 
            className={cn(
              "ml-1 h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
            aria-hidden="true" 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
        {secondaryLinks.map((link) => {
          const isActive = currentPath === link.path;
          return (
            <DropdownMenuItem key={link.path} asChild>
              <Link
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'w-full cursor-pointer',
                  isActive && 'bg-primary/10 text-primary'
                )}
              >
                {link.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export function Header() {
  const location = useLocation();
  const { wallet, isConnecting, connectWallet, disconnectWallet, network } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-strong" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Badge Pattern (inspired by Stacks Bridge) */}
          <Link 
            to="/" 
            className="flex items-center gap-3" 
            data-onboarding="logo"
            aria-label="AnchorX - Go to homepage"
          >
            <div className="flex items-center gap-2">
              {/* Logo Icon */}
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md" aria-hidden="true">
                <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
                  {/* Ethereum diamond */}
                  <path d="M16 4 L21 11 L16 14 L11 11 Z" fill="white" opacity="0.95"/>
                  <path d="M16 14 L21 11 L16 9 L11 11 Z" fill="white" opacity="0.6"/>
                  {/* Stacks bars */}
                  <path d="M9 18 L23 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M7 23 L25 23" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Bridge pillars */}
                  <path d="M12 18 L10 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                  <path d="M20 18 L22 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                  {/* Center connection */}
                  <path d="M16 14 L16 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              {/* Brand Name */}
              <span className="text-lg font-semibold text-foreground">AnchorX</span>
            </div>
            {/* Bridge Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-primary" fill="currentColor">
                <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 8 L7 10 L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <span className="text-xs font-medium text-primary">Bridge</span>
            </div>
          </Link>

          {/* Tablet Nav (md to lg) - Shows primary links + More dropdown */}
          <nav className="hidden md:flex lg:hidden items-center gap-1" aria-label="Tablet navigation">
            {primaryLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap',
                    'after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:rounded-full',
                    'after:bg-gradient-to-r after:from-primary after:to-accent',
                    'after:shadow-[0_0_8px_2px_hsl(var(--primary)/0.5)]',
                    'after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100',
                    isActive
                      ? 'bg-primary/10 text-primary after:scale-x-100'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* More dropdown for secondary links */}
            <MoreDropdown currentPath={location.pathname} />
          </nav>

          {/* Desktop Nav (lg and up) - Shows all links */}
          <nav id="main-navigation" className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const onboardingId = 
                link.path === '/bridge' ? 'bridge-link' :
                link.path === '/dashboard' ? 'dashboard-link' :
                link.path === '/how-it-works' ? 'how-it-works-link' :
                undefined;
              const isActive = location.pathname === link.path;
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  data-onboarding={onboardingId}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap',
                    'after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:rounded-full',
                    'after:bg-gradient-to-r after:from-primary after:to-accent',
                    'after:shadow-[0_0_8px_2px_hsl(var(--primary)/0.5)]',
                    'after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100',
                    isActive
                      ? 'bg-primary/10 text-primary after:scale-x-100'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
            {wallet.isConnected ? (
              <WalletDropdown
                ethereumAddress={wallet.ethereumAddress}
                stacksAddress={wallet.stacksAddress}
                usdcBalance={wallet.usdcBalance}
                usdcxBalance={wallet.usdcxBalance}
                network={network}
                onDisconnect={disconnectWallet}
              />
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                data-onboarding="connect-wallet"
                className="hidden sm:flex bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                aria-label={isConnecting ? 'Connecting wallet...' : 'Connect your cryptocurrency wallet'}
              >
                <Wallet className="h-4 w-4 mr-2" aria-hidden="true" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav 
            id="mobile-navigation"
            className="lg:hidden py-3 border-t border-border/50 animate-fade-in"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Mobile Wallet Section */}
            <div className="mt-4 pt-4 border-t border-border/50 px-4">
              {wallet.isConnected ? (
                <div className="space-y-4">
                  {/* Network Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
                      network === 'mainnet' 
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      <Circle className={cn(
                        "h-2 w-2 fill-current",
                        network === 'mainnet' ? "text-green-400" : "text-yellow-400"
                      )} />
                      {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                    </span>
                  </div>

                  {/* Ethereum Wallet */}
                  {wallet.ethereumAddress && (
                    <div className="glass rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-ethereum/20 flex items-center justify-center">
                          <ChainIcon chain="ethereum" className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Ethereum</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-muted-foreground">{formatAddress(wallet.ethereumAddress, 6, 4)}</span>
                        <span className="font-semibold">${formatAmount(wallet.usdcBalance)} USDC</span>
                      </div>
                    </div>
                  )}

                  {/* Stacks Wallet */}
                  {wallet.stacksAddress && (
                    <div className="glass rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-stacks/20 flex items-center justify-center">
                          <ChainIcon chain="stacks" className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Stacks</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-muted-foreground">{formatAddress(wallet.stacksAddress, 6, 4)}</span>
                        <span className="font-semibold">${formatAmount(wallet.usdcxBalance)} USDCx</span>
                      </div>
                    </div>
                  )}

                  {/* Total and Disconnect */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Total Balance</span>
                      <div className="font-bold">${formatAmount(wallet.usdcBalance + wallet.usdcxBalance)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        disconnectWallet();
                        setMobileMenuOpen(false);
                      }}
                      className="text-destructive hover:text-destructive"
                      aria-label="Disconnect wallet"
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    connectWallet();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  aria-label={isConnecting ? 'Connecting wallet...' : 'Connect your cryptocurrency wallet'}
                >
                  <Wallet className="h-4 w-4 mr-2" aria-hidden="true" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
