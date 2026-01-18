import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfettiCelebration } from './ConfettiCelebration';
import { AddressDisplay } from './AddressDisplay';
import { ChainIcon } from './ChainIcon';
import { motion } from 'framer-motion';
import { Check, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatAmount, getExplorerUrl } from '@/lib/data';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  fromChain: 'ethereum' | 'stacks';
  toChain: 'ethereum' | 'stacks';
  txHash: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  amount,
  fromChain,
  toChain,
  txHash,
}: SuccessModalProps) {
  const fromToken = fromChain === 'ethereum' ? 'USDC' : 'USDCx';
  const toToken = toChain === 'stacks' ? 'USDCx' : 'USDC';

  return (
    <>
      <ConfettiCelebration isActive={isOpen} />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass-strong border-success/30">
          <DialogTitle className="sr-only">Bridge Transaction Successful</DialogTitle>
          <DialogDescription className="sr-only">
            Your bridge transaction has completed successfully
          </DialogDescription>
          <div className="flex flex-col items-center text-center pt-2 sm:pt-4">
            {/* Success Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="relative mb-4 sm:mb-6"
            >
              <div className="absolute inset-0 bg-success/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg shadow-success/30">
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-success-foreground" strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Bridge Successful!</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Your tokens have been bridged successfully.
              </p>
            </motion.div>

            {/* Transaction Summary - stack on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full p-3 sm:p-4 rounded-xl bg-surface-2 mb-4 sm:mb-6"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <ChainIcon chain={fromChain} size="md" />
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-muted-foreground">Sent</p>
                    <p className="font-semibold font-mono text-sm sm:text-base">{formatAmount(amount)} {fromToken}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground rotate-90 sm:rotate-0" />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <ChainIcon chain={toChain} size="md" />
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-muted-foreground">Received</p>
                    <p className="font-semibold font-mono text-sm sm:text-base">{formatAmount(amount * 0.9975)} {toToken}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Transaction Hash */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full mb-4 sm:mb-6"
            >
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Transaction Hash</p>
              <div className="flex items-center justify-center gap-2">
                <AddressDisplay address={txHash} chain={fromChain} showCopy />
                <a
                  href={getExplorerUrl(fromChain, txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-surface-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </motion.div>

            {/* Actions - stack on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full"
            >
              <Button variant="outline" className="w-full sm:flex-1 min-h-[44px]" onClick={onClose}>
                Close
              </Button>
              <Button asChild className="w-full sm:flex-1 min-h-[44px] bg-gradient-to-r from-primary to-accent">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
