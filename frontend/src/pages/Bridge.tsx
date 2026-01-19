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
import { formatAmount, calculateBridgeFee, feeStructure } from '@/lib/data';
import { ArrowDownUp, Wallet, ChevronDown, Info, Loader2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePageMeta } from '@/hooks/usePageMeta';
import { usePreferences } from '@/hooks/usePreferences';

// Import bridge services
import { 
  executeDeposit, 
  executeWithdraw,
  saveBridgeTransaction,
  getMinWithdrawAmount,
  fetchRealGasFee,
  fetchStacksGasFee,
  type DepositProgress,
  type WithdrawProgress,
  type BridgeTransaction,
} from '@/lib/bridge';

type Direction = 'deposit' | 'withdraw';

export default function Bridge() {
  usePageMeta({
    title: 'Bridge USDC',
    description: 'Bridge your USDC between Ethereum and Stacks. Fast, secure, and with minimal fees. Start bridging in under a minute.',
    canonicalPath: '/bridge',
  });

  const { wallet, connectWallet, isConnecting, addTransaction, network, refreshBalances } = useWallet();
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
  const [lastBridgedAmount, setLastBridgedAmount] = useState(0); // Track the amount that was actually bridged
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
    
    // Determine recipient
    const destinationAddress = showRecipient && recipientAddress 
      ? recipientAddress 
      : (toChain === 'stacks' ? wallet.stacksAddress : wallet.ethereumAddress) || '';

    // Real blockchain bridge
    try {
      if (isDeposit) {
          // Deposit: ETH → STX (USDC → USDCx)
          if (!wallet.ethereumAddress || !wallet.stacksAddress) {
            throw new Error('Both wallets must be connected');
          }

          const result = await executeDeposit(
            {
              amount: amount,
              stacksRecipient: destinationAddress || wallet.stacksAddress,
              ethereumSender: wallet.ethereumAddress as `0x${string}`,
              network: network,
            },
            (progress: DepositProgress) => {
              // Map deposit steps to bridge timeline steps
              switch (progress.step) {
                case 'checking-allowance':
                case 'approving':
                  setBridgeStep('initiated');
                  break;
                case 'waiting-approval':
                  setBridgeStep('confirming');
                  setConfirmations(3);
                  break;
                case 'depositing':
                  setBridgeStep('confirming');
                  setConfirmations(8);
                  break;
                case 'waiting-deposit':
                  setBridgeStep('bridging');
                  setConfirmations(12);
                  break;
                case 'completed':
                  setBridgeStep('completed');
                  break;
                case 'error':
                  throw new Error(progress.error);
              }
              if (progress.depositTxHash) {
                setLastTxHash(progress.depositTxHash);
              }
            }
          );

          setLastTxHash(result.depositTxHash);
          
          // Fetch real gas fee from the transaction (async, don't block)
          let realGasFee = feeStructure.estimatedGasFee[fromChain]; // Default fallback
          try {
            const fetchedGas = await fetchRealGasFee(result.depositTxHash, network);
            if (fetchedGas > 0) {
              realGasFee = fetchedGas;
            }
          } catch (e) {
            console.warn('Could not fetch real gas fee, using estimate');
          }
          
          // Create transaction record with real gas fee
          const txRecord: BridgeTransaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            direction: 'deposit',
            amount: amount,
            status: 'completed',
            fromAddress: wallet.ethereumAddress!,
            toAddress: destinationAddress || wallet.stacksAddress!,
            txHash: result.depositTxHash,
            sourceTxHash: result.depositTxHash,
            timestamp: Date.now(),
            network: network,
            gasFeeUsd: realGasFee,
          };
          
          // Save to localStorage for persistence
          saveBridgeTransaction(txRecord);
          
          // Add to context state with real gas fee
          addTransaction({
            type: 'deposit',
            amount: numAmount,
            status: 'completed',
            fromChain,
            toChain,
            fromAddress: wallet.ethereumAddress,
            toAddress: destinationAddress || wallet.stacksAddress,
            txHash: result.depositTxHash,
            confirmations: 12,
            requiredConfirmations: 12,
            fee: numAmount * 0.0025,
            gasFee: realGasFee,
          });

        } else {
          // Withdraw: STX → ETH (USDCx → USDC)
          if (!wallet.stacksAddress || !wallet.ethereumAddress) {
            throw new Error('Both wallets must be connected');
          }

          const result = await executeWithdraw(
            {
              amount: amount,
              ethereumRecipient: (destinationAddress || wallet.ethereumAddress) as `0x${string}`,
              stacksSender: wallet.stacksAddress,
              network: network,
            },
            (progress: WithdrawProgress) => {
              switch (progress.step) {
                case 'preparing':
                  setBridgeStep('initiated');
                  break;
                case 'signing':
                  setBridgeStep('confirming');
                  setConfirmations(2);
                  break;
                case 'broadcasting':
                case 'pending':
                  setBridgeStep('bridging');
                  setConfirmations(6);
                  break;
                case 'completed':
                  setBridgeStep('completed');
                  break;
                case 'error':
                  throw new Error(progress.error);
              }
              if (progress.txId) {
                setLastTxHash(progress.txId);
              }
            }
          );

          setLastTxHash(result.txId);

          // Fetch real gas fee from Stacks transaction (async)
          let realGasFee = feeStructure.estimatedGasFee[fromChain]; // Default fallback
          try {
            const fetchedGas = await fetchStacksGasFee(result.txId, network);
            if (fetchedGas > 0) {
              realGasFee = fetchedGas;
            }
          } catch (e) {
            console.warn('Could not fetch real Stacks gas fee, using estimate');
          }

          // Create transaction record for withdraw with real gas fee
          const withdrawTxRecord: BridgeTransaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            direction: 'withdraw',
            amount: amount,
            status: 'processing',
            fromAddress: wallet.stacksAddress!,
            toAddress: destinationAddress || wallet.ethereumAddress!,
            txHash: result.txId,
            sourceTxHash: result.txId,
            timestamp: Date.now(),
            network: network,
            gasFeeUsd: realGasFee,
          };
          
          // Save to localStorage for persistence
          saveBridgeTransaction(withdrawTxRecord);

          // Add transaction record to context with real gas fee
          addTransaction({
            type: 'withdraw',
            amount: numAmount,
            status: 'processing', // Withdraw takes longer
            fromChain,
            toChain,
            fromAddress: wallet.stacksAddress,
            toAddress: destinationAddress || wallet.ethereumAddress,
            txHash: result.txId,
            confirmations: 6,
            requiredConfirmations: 6,
            fee: numAmount * 0.0025,
            gasFee: realGasFee,
          });
        }

        setBridgeStep('completed');
        
        toast.success('Bridge initiated!', {
          description: `Your ${fromToken.toUpperCase()} is being bridged to ${toChain === 'stacks' ? 'Stacks' : 'Ethereum'}. This may take ${isDeposit ? '10-30' : '20-60'} minutes.`,
        });

        // Refresh balances
        await refreshBalances();

        await new Promise(r => setTimeout(r, 1000));
        setLastBridgedAmount(numAmount); // Store the bridged amount before clearing input
        setShowSuccess(true);
        setAmount('');

      } catch (error: any) {
        console.error('Bridge error:', error);
        toast.error('Bridge failed', {
          description: error.message || 'Transaction was cancelled or failed',
        });
        setBridgeStep('idle');
      } finally {
        setIsBridging(false);
        setConfirmations(0);
      }
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
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          Balance: <span className="font-mono">{formatAmount(balance)}</span> {fromToken.toUpperCase()}
                        </span>
                        {direction === 'withdraw' && (
                          <span className="text-[10px] text-amber-500/80">
                            Min withdrawal: $4.80 USDCx
                          </span>
                        )}
                      </div>
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
        amount={lastBridgedAmount}
        fromChain={fromChain}
        toChain={toChain}
        txHash={lastTxHash || '0x8f4d2c1a3b5e6f7d8c9b0a1e2f3d4c5b6a7e8f9d0c1b2a3e4f5d6c7b8a9e0f1'}
      />
    </Layout>
  );
}
