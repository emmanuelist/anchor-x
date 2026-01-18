import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChainIcon } from './ChainIcon';
import { TokenIcon } from './TokenIcon';
import { motion } from 'framer-motion';
import { ArrowDown, Clock, Fuel, Percent, Loader2 } from 'lucide-react';
import { formatAmount, FEE_STRUCTURE, calculateBridgeFee } from '@/lib/data';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  amount: number;
  fromChain: 'ethereum' | 'stacks';
  toChain: 'ethereum' | 'stacks';
}

export function PreviewModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  amount,
  fromChain,
  toChain,
}: PreviewModalProps) {
  const fromToken = fromChain === 'ethereum' ? 'USDC' : 'USDCx';
  const toToken = toChain === 'stacks' ? 'USDCx' : 'USDC';
  const bridgeFee = calculateBridgeFee(amount);
  const gasFee = FEE_STRUCTURE.estimatedGasFee[fromChain];
  const receiveAmount = amount - bridgeFee;
  const estimatedTime = fromChain === 'ethereum' ? '~12 minutes' : '~8 minutes';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass-strong">
        <DialogTitle className="text-lg sm:text-xl font-bold text-center">
          Confirm Bridge
        </DialogTitle>
        <DialogDescription className="sr-only">
          Review and confirm your bridge transaction details
        </DialogDescription>

        <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
          {/* From Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 sm:p-4 rounded-xl bg-surface-2"
          >
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">You Send</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <ChainIcon chain={fromChain} size="lg" />
                  <TokenIcon 
                    token={fromToken.toLowerCase() as 'usdc' | 'usdcx'} 
                    size="sm" 
                    className="absolute -bottom-1 -right-1"
                  />
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg">{fromToken}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground capitalize">{fromChain}</p>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-mono">{formatAmount(amount)}</p>
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="flex justify-center -my-2 sm:-my-3 relative z-10">
            <div className="p-2 rounded-full bg-surface-3 border border-border">
              <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>

          {/* To Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 sm:p-4 rounded-xl bg-surface-2"
          >
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">You Receive</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <ChainIcon chain={toChain} size="lg" />
                  <TokenIcon 
                    token={toToken.toLowerCase() as 'usdc' | 'usdcx'} 
                    size="sm" 
                    className="absolute -bottom-1 -right-1"
                  />
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg">{toToken}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground capitalize">{toChain}</p>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-mono text-success">{formatAmount(receiveAmount)}</p>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-xl bg-surface-1 border border-border/50"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Bridge Fee ({FEE_STRUCTURE.bridgeFeePercent}%)</span>
              </div>
              <span className="font-mono">${formatAmount(bridgeFee)}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Fuel className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Gas Fee ({fromChain === 'ethereum' ? 'ETH' : 'STX'})</span>
              </div>
              <span className="font-mono">${formatAmount(gasFee)}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Estimated Time</span>
              </div>
              <span>{estimatedTime}</span>
            </div>
          </motion.div>

          {/* Confirm Button - stack on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3"
          >
            <Button variant="outline" className="w-full sm:flex-1 min-h-[44px]" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              className="w-full sm:flex-1 min-h-[44px] bg-gradient-to-r from-primary to-accent" 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Bridging...
                </>
              ) : (
                'Confirm Bridge'
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
