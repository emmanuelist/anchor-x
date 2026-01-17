import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'anchorx-onboarding-completed';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function useOnboarding(steps: OnboardingStep[]) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setHasCompleted(false);
      // Delay start to allow page to render
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsActive(false);
    setHasCompleted(true);
  }, []);

  const restartOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setCurrentStep(0);
    setHasCompleted(false);
    setIsActive(true);
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    step: steps[currentStep],
    hasCompleted,
    nextStep,
    prevStep,
    skipOnboarding,
    restartOnboarding,
  };
}
