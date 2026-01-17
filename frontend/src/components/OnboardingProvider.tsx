import { createContext, useContext, ReactNode } from 'react';
import { useOnboarding, OnboardingStep } from '@/hooks/useOnboarding';
import { OnboardingTour } from '@/components/ui/OnboardingTour';

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    target: '[data-onboarding="logo"]',
    title: 'Welcome to AnchorX! 👋',
    description: 'The fastest way to bridge USDC between Ethereum and Stacks. Let us show you around!',
    position: 'bottom',
  },
  {
    id: 'bridge',
    target: '[data-onboarding="bridge-link"]',
    title: 'Start Bridging',
    description: 'Click here to access the bridge interface where you can transfer USDC to Stacks and receive USDCx.',
    position: 'bottom',
  },
  {
    id: 'connect-wallet',
    target: '[data-onboarding="connect-wallet"]',
    title: 'Connect Your Wallet',
    description: 'Link your Ethereum wallet to start bridging. We support MetaMask, WalletConnect, and more.',
    position: 'bottom',
  },
  {
    id: 'dashboard',
    target: '[data-onboarding="dashboard-link"]',
    title: 'Track Your Portfolio',
    description: 'View your balances, transaction history, and portfolio performance on the Dashboard.',
    position: 'bottom',
  },
  {
    id: 'how-it-works',
    target: '[data-onboarding="how-it-works-link"]',
    title: 'Learn How It Works',
    description: 'New to bridging? Check out our step-by-step guide to understand the process.',
    position: 'bottom',
  },
  {
    id: 'cta',
    target: '[data-onboarding="hero-cta"]',
    title: 'Ready to Bridge? 🚀',
    description: 'Click this button to make your first bridge and unlock Bitcoin-powered DeFi!',
    position: 'top',
  },
];

interface OnboardingContextType {
  restartOnboarding: () => void;
  hasCompleted: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const {
    isActive,
    currentStep,
    totalSteps,
    step,
    hasCompleted,
    nextStep,
    prevStep,
    skipOnboarding,
    restartOnboarding,
  } = useOnboarding(onboardingSteps);

  return (
    <OnboardingContext.Provider value={{ restartOnboarding, hasCompleted }}>
      {children}
      <OnboardingTour
        isActive={isActive}
        step={step}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipOnboarding}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}
