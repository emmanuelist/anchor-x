import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackgroundEffects } from '@/components/ui/BackgroundEffects';
import { SkipLink } from '@/components/ui/SkipLink';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

interface LayoutProps {
  children: ReactNode;
  backgroundVariant?: 'default' | 'hero' | 'subtle';
}

export function Layout({ children, backgroundVariant = 'default' }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip Links for keyboard/screen reader users */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#main-navigation" className="focus:top-14">Skip to navigation</SkipLink>
      
      <ScrollProgress />
      <BackgroundEffects variant={backgroundVariant} />
      <Header />
      <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
