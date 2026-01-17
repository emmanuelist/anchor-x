import { motion } from 'framer-motion';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionStep } from '@/lib/mockData';
import { format } from 'date-fns';

interface TransactionDetailTimelineProps {
  transaction: Transaction;
  className?: string;
}

function getTransactionSteps(tx: Transaction): TransactionStep[] {
  const baseTime = tx.timestamp.getTime();
  
  if (tx.status === 'failed') {
    return [
      {
        id: 'submitted',
        label: 'Submitted',
        status: 'completed',
        timestamp: new Date(baseTime),
        details: `Block #${tx.fromChain === 'ethereum' ? '19,234,555' : '156,789'}`,
      },
      {
        id: 'failed',
        label: 'Transaction Failed',
        status: 'failed',
        timestamp: new Date(baseTime + 2 * 60 * 1000),
        details: 'Insufficient gas or network error',
      },
    ];
  }

  if (tx.status === 'pending') {
    return [
      {
        id: 'submitted',
        label: 'Submitted',
        status: 'current',
        timestamp: new Date(baseTime),
        details: 'Waiting for network confirmation',
      },
      {
        id: 'confirming',
        label: 'Confirming',
        status: 'pending',
        details: `0/${tx.requiredConfirmations} confirmations`,
      },
      {
        id: 'bridging',
        label: 'Bridge Processing',
        status: 'pending',
        details: 'xReserve validation',
      },
      {
        id: 'destination',
        label: tx.type === 'deposit' ? 'Minting USDCx' : 'Releasing USDC',
        status: 'pending',
        details: `On ${tx.toChain === 'ethereum' ? 'Ethereum' : 'Stacks'}`,
      },
      {
        id: 'completed',
        label: 'Completed',
        status: 'pending',
      },
    ];
  }

  if (tx.status === 'confirming') {
    return [
      {
        id: 'submitted',
        label: 'Submitted',
        status: 'completed',
        timestamp: new Date(baseTime),
        details: `Block #${tx.fromChain === 'ethereum' ? '19,234,555' : '156,789'}`,
      },
      {
        id: 'confirming',
        label: 'Confirming',
        status: 'current',
        timestamp: new Date(baseTime + 1 * 60 * 1000),
        details: `${tx.confirmations}/${tx.requiredConfirmations} confirmations`,
        blockNumber: tx.fromChain === 'ethereum' ? 19234555 + tx.confirmations : 156789 + tx.confirmations,
      },
      {
        id: 'bridging',
        label: 'Bridge Processing',
        status: 'pending',
        details: 'xReserve validation',
      },
      {
        id: 'destination',
        label: tx.type === 'deposit' ? 'Minting USDCx' : 'Releasing USDC',
        status: 'pending',
        details: `On ${tx.toChain === 'ethereum' ? 'Ethereum' : 'Stacks'}`,
      },
      {
        id: 'completed',
        label: 'Completed',
        status: 'pending',
      },
    ];
  }

  // Completed transaction
  return [
    {
      id: 'submitted',
      label: 'Submitted',
      status: 'completed',
      timestamp: new Date(baseTime),
      details: `Block #${tx.fromChain === 'ethereum' ? '19,234,555' : '156,789'}`,
    },
    {
      id: 'confirming',
      label: 'Confirmed',
      status: 'completed',
      timestamp: new Date(baseTime + 2 * 60 * 1000),
      details: `${tx.requiredConfirmations}/${tx.requiredConfirmations} confirmations`,
    },
    {
      id: 'bridging',
      label: 'Bridge Processed',
      status: 'completed',
      timestamp: new Date(baseTime + 5 * 60 * 1000),
      details: 'xReserve validated',
    },
    {
      id: 'destination',
      label: tx.type === 'deposit' ? 'USDCx Minted' : 'USDC Released',
      status: 'completed',
      timestamp: new Date(baseTime + 8 * 60 * 1000),
      details: `On ${tx.toChain === 'ethereum' ? 'Ethereum' : 'Stacks'}`,
      blockNumber: tx.toChain === 'ethereum' ? 19234680 : 156850,
    },
    {
      id: 'completed',
      label: 'Completed',
      status: 'completed',
      timestamp: new Date(baseTime + 9 * 60 * 1000),
    },
  ];
}

function getStepIcon(status: TransactionStep['status']) {
  switch (status) {
    case 'completed':
      return <Check className="h-3 w-3 sm:h-4 sm:w-4" />;
    case 'current':
      return <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
    default:
      return <Circle className="h-2 w-2 sm:h-3 sm:w-3" />;
  }
}

function getStepColors(status: TransactionStep['status']) {
  switch (status) {
    case 'completed':
      return 'bg-primary text-primary-foreground';
    case 'current':
      return 'bg-primary/20 text-primary border-2 border-primary';
    case 'failed':
      return 'bg-destructive/20 text-destructive border-2 border-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function TransactionDetailTimeline({ transaction, className }: TransactionDetailTimelineProps) {
  const steps = getTransactionSteps(transaction);
  
  const completedTime = transaction.status === 'completed' 
    ? Math.round((steps[steps.length - 1].timestamp!.getTime() - transaction.timestamp.getTime()) / 60000)
    : null;

  return (
    <div className={cn('space-y-1', className)}>
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Transaction Timeline
      </h4>
      
      <div className="relative">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-3 sm:gap-4 pb-4 sm:pb-6 last:pb-0"
          >
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "absolute left-[11px] sm:left-[15px] top-6 sm:top-8 w-0.5 h-[calc(100%-18px)] sm:h-[calc(100%-24px)]",
                  step.status === 'completed' ? 'bg-primary/50' : 'bg-border'
                )}
              />
            )}
            
            {/* Step Indicator */}
            <div 
              className={cn(
                "relative z-10 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0",
                getStepColors(step.status)
              )}
            >
              {getStepIcon(step.status)}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  "font-medium",
                  step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                  step.status === 'failed' && 'text-destructive'
                )}>
                  {step.label}
                </p>
                {step.timestamp && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(step.timestamp, 'h:mm a')}
                  </span>
                )}
              </div>
              
              {step.details && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.details}
                </p>
              )}
              
              {/* Confirmation Progress Bar */}
              {step.id === 'confirming' && step.status === 'current' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Block confirmations</span>
                    <span>{transaction.confirmations}/{transaction.requiredConfirmations}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(transaction.confirmations / transaction.requiredConfirmations) * 100}%` 
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Total Time */}
      {completedTime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4 mt-4 border-t border-border/50"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Total time:</span> {completedTime} minutes
          </p>
        </motion.div>
      )}
    </div>
  );
}
