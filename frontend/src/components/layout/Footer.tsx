import { Link } from 'react-router-dom';
import { Github, Twitter, MessageCircle, HelpCircle } from 'lucide-react';
import { useOnboardingContext } from '@/components/OnboardingProvider';

export function Footer() {
  const { restartOnboarding, hasCompleted } = useOnboardingContext();

  return (
    <footer className="border-t border-border/50 bg-surface-1/50 backdrop-blur-sm" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto px-4 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold gradient-text">AnchorX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bridge USDC to Bitcoin's DeFi ecosystem. Secure, fast, and reliable.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product links">
            <h4 className="font-semibold text-sm mb-3 sm:mb-4">Product</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/bridge" className="hover:text-foreground transition-colors">Bridge</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/transactions" className="hover:text-foreground transition-colors">Transactions</Link></li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources links">
            <h4 className="font-semibold text-sm mb-3 sm:mb-4">Resources</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              {hasCompleted && (
                <li>
                  <button 
                    onClick={restartOnboarding}
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                    aria-label="Restart onboarding tour"
                  >
                    <HelpCircle className="h-3 w-3" aria-hidden="true" />
                    Take a Tour
                  </button>
                </li>
              )}
            </ul>
          </nav>

          {/* Social */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold text-sm mb-3 sm:mb-4">Community</h4>
            <div className="flex gap-2 sm:gap-3" role="list" aria-label="Social media links">
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Follow us on Twitter"
                role="listitem"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Join our Discord community"
                role="listitem"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="View our GitHub repository"
                role="listitem"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AnchorX. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
