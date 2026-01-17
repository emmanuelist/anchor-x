import { formatAmount, getTimeAgo, mockTransactions, formatAddress } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function TransactionTicker() {
  const prefersReducedMotion = useReducedMotion();
  
  // Double the transactions for seamless loop
  const transactions = [...mockTransactions, ...mockTransactions];

  // Show static version for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="py-4 bg-surface-1/50 backdrop-blur-sm border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-6 justify-center">
            {mockTransactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground font-mono text-xs">
                  {formatAddress(tx.fromAddress, 4, 4)}
                </span>
                <span className="text-muted-foreground">bridged</span>
                <span className="font-semibold text-foreground">
                  {formatAmount(tx.amount)} {tx.fromChain === 'ethereum' ? 'USDC' : 'USDCx'}
                </span>
                <ArrowRight className="h-3 w-3 text-primary" />
                <span className={tx.toChain === 'stacks' ? 'text-stacks' : 'text-ethereum'}>
                  {tx.toChain === 'stacks' ? 'Stacks' : 'Ethereum'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-4 bg-surface-1/50 backdrop-blur-sm border-y border-border/30">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: [0, -50 * mockTransactions.length * 8],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {transactions.map((tx, i) => (
          <div
            key={`${tx.id}-${i}`}
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-muted-foreground font-mono text-xs">
              {formatAddress(tx.fromAddress, 4, 4)}
            </span>
            <span className="text-muted-foreground">bridged</span>
            <span className="font-semibold text-foreground">
              {formatAmount(tx.amount)} {tx.fromChain === 'ethereum' ? 'USDC' : 'USDCx'}
            </span>
            <ArrowRight className="h-3 w-3 text-primary" />
            <span className={tx.toChain === 'stacks' ? 'text-stacks' : 'text-ethereum'}>
              {tx.toChain === 'stacks' ? 'Stacks' : 'Ethereum'}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs">
              {getTimeAgo(tx.timestamp)}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
