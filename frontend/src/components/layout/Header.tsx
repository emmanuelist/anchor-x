import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/mockData';
import { Wallet, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Primary links shown directly in tablet nav
const primaryLinks = [
  { path: '/', label: 'Home' },
  { path: '/bridge', label: 'Bridge' },
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

export function Header() {
  const location = useLocation();
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-strong" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2" 
            data-onboarding="logo"
            aria-label="AnchorX - Go to homepage"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold gradient-text">AnchorX</span>
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
            <DropdownMenu open={moreDropdownOpen} onOpenChange={setMoreDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-all duration-200',
                    secondaryLinks.some(link => link.path === location.pathname)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    moreDropdownOpen && 'text-foreground bg-muted/50 shadow-glow-sm ring-1 ring-primary/30'
                  )}
                >
                  More
                  <ChevronDown 
                    className={cn(
                      "ml-1 h-4 w-4 transition-transform duration-200",
                      moreDropdownOpen && "rotate-180"
                    )} 
                    aria-hidden="true" 
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                {secondaryLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <DropdownMenuItem key={link.path} asChild>
                      <Link
                        to={link.path}
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
              <div className="hidden sm:flex items-center gap-2">
                <div 
                  className="glass px-3 py-1.5 rounded-lg text-sm font-mono"
                  aria-label={`Connected wallet: ${wallet.ethereumAddress}`}
                >
                  {formatAddress(wallet.ethereumAddress || '')}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={disconnectWallet}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Disconnect wallet"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
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
                <div className="flex items-center justify-between">
                  <div 
                    className="glass px-3 py-1.5 rounded-lg text-sm font-mono"
                    aria-label={`Connected wallet: ${wallet.ethereumAddress}`}
                  >
                    {formatAddress(wallet.ethereumAddress || '')}
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
