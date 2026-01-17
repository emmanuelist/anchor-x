import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@/hooks/useOnboarding';

interface OnboardingTourProps {
  isActive: boolean;
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function OnboardingTour({
  isActive,
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: OnboardingTourProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (!target) {
        // If target not found, position in center
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 160,
          arrowPosition: 'top',
        });
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      const tooltipWidth = 320;
      const tooltipHeight = 180;
      const padding = 16;
      const arrowOffset = 12;

      let top = 0;
      let left = 0;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

      const preferredPosition = step.position || 'bottom';

      switch (preferredPosition) {
        case 'bottom':
          top = rect.bottom + arrowOffset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'top';
          break;
        case 'top':
          top = rect.top - tooltipHeight - arrowOffset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'bottom';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - arrowOffset;
          arrowPosition = 'right';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + arrowOffset;
          arrowPosition = 'left';
          break;
      }

      // Clamp to viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setPosition({ top, left, arrowPosition });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, step]);

  if (!isActive || !step || !position) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
            }}
          />

          {/* Target highlight */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[9999] rounded-xl pointer-events-none"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.75), 0 0 30px 4px hsl(var(--primary) / 0.5)',
                border: '2px solid hsl(var(--primary))',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[10000] w-80 glass-strong rounded-xl p-4 shadow-2xl"
            style={{
              top: position.top,
              left: position.left,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            aria-describedby="onboarding-description"
          >
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-3 h-3 bg-surface-1 rotate-45 border-border/50',
                position.arrowPosition === 'top' && '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t',
                position.arrowPosition === 'bottom' && '-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b',
                position.arrowPosition === 'left' && '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b',
                position.arrowPosition === 'right' && '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t'
              )}
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" aria-hidden="true">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                  <h3 id="onboarding-title" className="font-bold text-sm">{step.title}</h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onSkip}
                aria-label="Skip onboarding tour"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Description */}
            <p id="onboarding-description" className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {step.description}
            </p>

            {/* Progress dots */}
            <div 
              className="flex items-center justify-center gap-1.5 mb-4" 
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-label={`Onboarding progress: step ${currentStep + 1} of ${totalSteps}`}
            >
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentStep
                      ? 'w-6 bg-primary'
                      : i < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Skip tour
              </Button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrev}
                    className="h-8"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onNext}
                  className="h-8 bg-gradient-to-r from-primary to-accent"
                >
                  {currentStep === totalSteps - 1 ? (
                    'Get Started'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
