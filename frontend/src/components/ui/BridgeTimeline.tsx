import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BridgeStep = 'idle' | 'initiated' | 'confirming' | 'bridging' | 'completed';

interface BridgeTimelineProps {
  currentStep: BridgeStep;
  confirmations?: number;
  requiredConfirmations?: number;
  className?: string;
}

const steps = [
  { id: 'initiated', label: 'Initiated', description: 'Transaction submitted' },
  { id: 'confirming', label: 'Confirming', description: 'Waiting for blocks' },
  { id: 'bridging', label: 'Bridging', description: 'Cross-chain transfer' },
  { id: 'completed', label: 'Completed', description: 'Tokens received' },
];

const stepOrder: Record<BridgeStep, number> = {
  idle: -1,
  initiated: 0,
  confirming: 1,
  bridging: 2,
  completed: 3,
};

export function BridgeTimeline({
  currentStep,
  confirmations = 0,
  requiredConfirmations = 12,
  className,
}: BridgeTimelineProps) {
  const currentIndex = stepOrder[currentStep];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-border" />
        
        {/* Progress line filled */}
        <motion.div
          className="absolute top-5 left-8 h-0.5 bg-gradient-to-r from-primary to-accent"
          initial={{ width: '0%' }}
          animate={{ 
            width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' 
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ maxWidth: 'calc(100% - 64px)' }}
        />

        {steps.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isPending = currentIndex < index;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300',
                  isCompleted && 'bg-success border-success',
                  isCurrent && 'bg-primary border-primary',
                  isPending && 'bg-surface-2 border-border'
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="h-5 w-5 text-success-foreground" />
                  </motion.div>
                ) : isCurrent ? (
                  step.id === 'confirming' || step.id === 'bridging' ? (
                    <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                  )
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </motion.div>

              <div className="mt-3 text-center">
                <p className={cn(
                  'text-sm font-medium transition-colors',
                  isCompleted && 'text-success',
                  isCurrent && 'text-foreground',
                  isPending && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.id === 'confirming' && isCurrent
                    ? `${confirmations}/${requiredConfirmations} blocks`
                    : step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
