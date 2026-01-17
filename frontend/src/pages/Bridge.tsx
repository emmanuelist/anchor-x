import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/GlowCard';
import { ChainIcon } from '@/components/ui/ChainIcon';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { AnimatedBorder } from '@/components/ui/AnimatedBorder';
import { PreviewModal } from '@/components/ui/PreviewModal';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { BridgeTimeline, BridgeStep } from '@/components/ui/BridgeTimeline';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { formatAmount, calculateBridgeFee, feeStructure } from '@/lib/mockData';
import { ArrowDownUp, Wallet, ChevronDown, Info, Loader2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePageMeta } from '@/hooks/usePageMeta';
import { usePreferences } from '@/hooks/usePreferences';

type Direction = 'deposit' | 'withdraw';

export default function Bridge() {
  usePageMeta({
    title: 'Bridge USDC',
    description: 'Bridge your USDC between Ethereum and Stacks. Fast, secure, and with minimal fees. Start bridging in under a minute.',
    canonicalPath: '/bridge',
  });

  const { wallet, connectWallet, isConnecting, addTransaction } = useWallet();
  const { preferences, isLoaded, updateBridgePreferences } = usePreferences();
  
  const [direction, setDirection] = useState<Direction>('deposit');
  const [amount, setAmount] = useState('');
  const [showFees, setShowFees] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState<BridgeStep>('idle');
  const [confirmations, setConfirmations] = useState(0);
  const [lastTxHash, setLastTxHash] = useState('');
  const [showRecipient, setShowRecipient] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');

  // Load saved preferences on mount
  useEffect(() => {
    if (isLoaded) {
      setDirection(preferences.bridge.direction);
      if (preferences.bridge.lastAmount) {
        setAmount(preferences.bridge.lastAmount);
      }
      setShowRecipient(preferences.bridge.showRecipient);
    }
  }, [isLoaded, preferences.bridge.direction, preferences.bridge.lastAmount, preferences.bridge.showRecipient]);

  // Save direction preference when it changes
  useEffect(() => {
    if (isLoaded) {
      updateBridgePreferences({ direction });
    }
  }, [direction, isLoaded, updateBridgePreferences]);

  // Save recipient toggle preference
  useEffect(() => {
    if (isLoaded) {
      updateBridgePreferences({ showRecipient });
    }
  }, [showRecipient, isLoaded, updateBridgePreferences]);

  // Save last amount when user leaves the page or amount changes significantly
  useEffect(() => {
    if (isLoaded && amount) {
      const timeoutId = setTimeout(() => {
        updateBridgePreferences({ lastAmount: amount });
      }, 1000); // Debounce to avoid excessive writes
      return () => clearTimeout(timeoutId);
    }
  }, [amount, isLoaded, updateBridgePreferences]);

  const isDeposit = direction === 'deposit';
  const fromChain = isDeposit ? 'ethereum' : 'stacks';
  const toChain = isDeposit ? 'stacks' : 'ethereum';
  const fromToken = isDeposit ? 'usdc' : 'usdcx';
  const toToken = isDeposit ? 'usdcx' : 'usdc';
  const balance = isDeposit ? wallet.usdcBalance : wallet.usdcxBalance;

  const numAmount = parseFloat(amount) || 0;
  const bridgeFee = calculateBridgeFee(numAmount);
  const gasFee = feeStructure.estimatedGasFee[fromChain];
  const totalFee = bridgeFee + gasFee;
  const receiveAmount = Math.max(0, numAmount - bridgeFee);

  // Address validation
  const isValidEthAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  const isValidStxAddress = (addr: string) => /^S[PM][A-Z0-9]{38,40}$/.test(addr);
  
  const validateRecipient = () => {
    if (!showRecipient || !recipientAddress) return true;
    if (toChain === 'ethereum') return isValidEthAddress(recipientAddress);
    return isValidStxAddress(recipientAddress);
  };
  
  const recipientValid = validateRecipient();

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setDirection(d => d === 'deposit' ? 'withdraw' : 'deposit');
      setAmount('');
      setIsSwapping(false);
    }, 300);
  };

  const handlePercentage = (pct: number) => {
    if (!wallet.isConnected) return;
    setAmount(formatAmount(balance * pct, 2));
  };

  const handleBridgeClick = () => {
    if (numAmount <= 0 || numAmount > balance) return;
    if (showRecipient && !recipientValid) {
      toast.error('Invalid recipient address', {
        description: `Please enter a valid ${toChain === 'ethereum' ? 'Ethereum' : 'Stacks'} address`,
      });
      return;
    }
    setShowPreview(true);
  };

  const simulateBridgeProcess = async () => {
    setIsBridging(true);
    setShowPreview(false);
    setBridgeStep('initiated');
    
    // Generate fake tx hash
    const txHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    setLastTxHash(txHash);

    // Simulate initiated → confirming
    await new Promise(r => setTimeout(r, 1500));
    setBridgeStep('confirming');

    // Simulate confirmations
    const requiredConfs = isDeposit ? 12 : 6;
    for (let i = 1; i <= requiredConfs; i++) {
      await new Promise(r => setTimeout(r, 300));
      setConfirmations(i);
    }

    // Simulate bridging
    await new Promise(r => setTimeout(r, 500));
    setBridgeStep('bridging');
    await new Promise(r => setTimeout(r, 2000));

    // Complete
    setBridgeStep('completed');
    
    // Determine recipient
    const destinationAddress = showRecipient && recipientAddress 
      ? recipientAddress 
      : (toChain === 'stacks' ? wallet.stacksAddress : wallet.ethereumAddress) || '';

    // Add transaction
    addTransaction({
      type: isDeposit ? 'deposit' : 'withdraw',
      amount: numAmount,
      status: 'completed',
      fromChain,
      toChain,
      fromAddress: (fromChain === 'ethereum' ? wallet.ethereumAddress : wallet.stacksAddress) || '',
      toAddress: destinationAddress,
      txHash,
      confirmations: requiredConfs,
      requiredConfirmations: requiredConfs,
      fee: numAmount * 0.0025,
      gasFee: feeStructure.estimatedGasFee[fromChain],
    });

    toast.success('Bridge completed!', {
      description: `Successfully bridged ${formatAmount(numAmount)} ${fromToken.toUpperCase()}`,
    });

    await new Promise(r => setTimeout(r, 500));
    setIsBridging(false);
    setBridgeStep('idle');
    setConfirmations(0);
    setShowSuccess(true);
    setAmount('');
  };

  const canBridge = wallet.isConnected && numAmount > 0 && numAmount <= balance && recipientValid;

  return (
    <Layout>
      <section className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="max-w-lg mx-auto">
          <div>
            {/* Direction Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex rounded-xl glass p-1 mb-4 sm:mb-6"
            >
              <button
                onClick={() => setDirection('deposit')}
                className={cn(
                  'flex-1 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 min-h-[40px] sm:min-h-[44px]',
                  direction === 'deposit'
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="hidden sm:inline">Deposit (ETH → STX)</span>
                <span className="sm:hidden">Deposit</span>
              </button>
              <button
                onClick={() => setDirection('withdraw')}
                className={cn(
                  'flex-1 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 min-h-[40px] sm:min-h-[44px]',
                  direction === 'withdraw'
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="hidden sm:inline">Withdraw (STX → ETH)</span>
                <span className="sm:hidden">Withdraw</span>
              </button>
            </motion.div>

            {/* Bridge Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <AnimatedBorder active={canBridge}>
                <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3">
                {/* From Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">From</span>
                    {wallet.isConnected && (
                      <span className="text-xs text-muted-foreground">
                        Balance: <span className="font-mono">{formatAmount(balance)}</span> {fromToken.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <motion.div 
                    className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-surface-2"
                    animate={{ rotateY: isSwapping ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ perspective: 1000 }}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-3 shrink-0">
                      <ChainIcon chain={fromChain} size="sm" />
                      <TokenIcon token={fromToken} size="sm" />
                      <span className="font-medium text-sm">{fromToken.toUpperCase()}</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 min-w-0 bg-transparent text-lg sm:text-xl font-bold text-right outline-none placeholder:text-muted-foreground/50 font-mono"
                    />
                  </motion.div>

                  {/* Percentage buttons */}
                  <div className="flex gap-1.5">
                    {[0.25, 0.5, 0.75, 1].map((pct) => (
                      <motion.button
                        key={pct}
                        onClick={() => handlePercentage(pct)}
                        disabled={!wallet.isConnected}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-1.5 sm:py-2 text-xs font-medium rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] sm:min-h-[36px]"
                      >
                        {pct === 1 ? 'MAX' : `${pct * 100}%`}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-0.5 relative z-10">
                  <motion.button
                    onClick={handleSwap}
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 rounded-xl bg-surface-3 border border-border hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
                  >
                    <ArrowDownUp className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* To Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">To</span>
                    <button
                      onClick={() => setShowRecipient(!showRecipient)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <UserPlus className="h-3 w-3" />
                      {showRecipient ? 'Use my address' : 'Send to different address'}
                    </button>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-surface-2"
                    animate={{ rotateY: isSwapping ? -180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-3 shrink-0">
                      <ChainIcon chain={toChain} size="sm" />
                      <TokenIcon token={toToken} size="sm" />
                      <span className="font-medium text-sm">{toToken.toUpperCase()}</span>
                    </div>
                    <span className="flex-1 text-lg sm:text-xl font-bold text-right font-mono text-muted-foreground">
                      {numAmount > 0 ? formatAmount(receiveAmount) : '0.00'}
                    </span>
                  </motion.div>

                  {/* Recipient Address Input */}
                  <AnimatePresence>
                    {showRecipient && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">
                            Recipient Address ({toChain === 'ethereum' ? 'Ethereum' : 'Stacks'})
                          </label>
                          <Input
                            placeholder={toChain === 'ethereum' ? '0x...' : 'SP...'}
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            className={cn(
                              'font-mono text-sm bg-surface-2',
                              recipientAddress && !recipientValid && 'border-destructive focus-visible:ring-destructive'
                            )}
                          />
                          {recipientAddress && !recipientValid && (
                            <p className="text-xs text-destructive">
                              Invalid {toChain === 'ethereum' ? 'Ethereum' : 'Stacks'} address format
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fee Breakdown */}
                <div className="pt-4 border-t border-border/50">
                  <button
                    onClick={() => setShowFees(!showFees)}
                    className="flex items-center justify-between w-full text-sm group"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-4 w-4" /> Fee Estimate
                    </span>
                    <span className="font-medium font-mono">${formatAmount(totalFee)}</span>
                  </button>

                  <AnimatePresence>
                    {showFees && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Bridge Fee ({feeStructure.bridgeFeePercent}%)</span>
                            <span className="font-mono">${formatAmount(bridgeFee)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Gas Fee ({fromChain === 'ethereum' ? 'ETH' : 'STX'})</span>
                            <span className="font-mono">${formatAmount(gasFee)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bridge Progress Timeline */}
                <AnimatePresence>
                  {bridgeStep !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4"
                    >
                      <BridgeTimeline 
                        currentStep={bridgeStep}
                        confirmations={confirmations}
                        requiredConfirmations={isDeposit ? 12 : 6}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Button */}
                <div className="pt-2">
                  {!wallet.isConnected ? (
                    <Button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-primary to-accent py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg group"
                    >
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:scale-110 transition-transform" />
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  ) : isBridging ? (
                    <Button
                      disabled
                      className="w-full bg-gradient-to-r from-primary to-accent py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg"
                    >
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                      Bridging...
                    </Button>
                  ) : (
                    <motion.div whileHover={{ scale: canBridge ? 1.01 : 1 }} whileTap={{ scale: canBridge ? 0.99 : 1 }}>
                      <Button
                        onClick={handleBridgeClick}
                        disabled={!canBridge}
                        className={cn(
                          "w-full py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg transition-all duration-300",
                          canBridge
                            ? "bg-gradient-to-r from-primary to-accent glow"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {numAmount <= 0
                          ? 'Enter Amount'
                          : numAmount > balance
                          ? 'Insufficient Balance'
                          : `Bridge ${formatAmount(numAmount)} ${fromToken.toUpperCase()}`}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </AnimatedBorder>
            </motion.div>

            {/* Info */}
            <motion.p 
              className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              Estimated time: ~{isDeposit ? '12' : '8'} minutes
            </motion.p>
          </div>
        </div>
      </section>

      {/* Modals */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={simulateBridgeProcess}
        isLoading={isBridging}
        amount={numAmount}
        fromChain={fromChain}
        toChain={toChain}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        amount={numAmount || 1000}
        fromChain={fromChain}
        toChain={toChain}
        txHash={lastTxHash || '0x8f4d2c1a3b5e6f7d8c9b0a1e2f3d4c5b6a7e8f9d0c1b2a3e4f5d6c7b8a9e0f1'}
      />
    </Layout>
  );
}
