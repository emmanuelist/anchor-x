import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlowCard } from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  transferUSDCx,
  getTransferStatus,
  getRecentRecipients,
  getAddressBook,
  addToAddressBook,
  removeFromAddressBook,
  isValidStacksAddress,
  estimateTransferFee,
  type RecentRecipient,
  type AddressBookEntry,
} from '@/lib/bridge/transfer';
import { formatAmount } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  BookUser,
  Star,
  StarOff,
  ExternalLink,
  ArrowRight,
  Copy,
  X,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TransferStep = 'input' | 'confirm' | 'sending' | 'success' | 'error';

export default function Transfer() {
  usePageMeta({
    title: 'Transfer USDCx',
    description: 'Send USDCx to any Stacks address instantly. Fast, secure peer-to-peer transfers within the Stacks network.',
    canonicalPath: '/transfer',
  });

  const { wallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<TransferStep>('input');
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Recent recipients and address book
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showAddToBook, setShowAddToBook] = useState(false);

  // Load data on mount
  useEffect(() => {
    setRecentRecipients(getRecentRecipients());
    setAddressBook(getAddressBook());
  }, []);

  // Derived state
  const parsedAmount = parseFloat(amount) || 0;
  const balance = wallet.usdcxBalance || 0;
  const hasEnoughBalance = parsedAmount > 0 && parsedAmount <= balance;
  const isValidRecipient = recipient ? isValidStacksAddress(recipient, 'testnet') : false;
  const isSameAddress = recipient.toLowerCase() === wallet.stacksAddress?.toLowerCase();
  const canTransfer = hasEnoughBalance && isValidRecipient && !isSameAddress && wallet.isConnected;

  // Check if recipient is in address book
  const recipientLabel = useMemo(() => {
    const entry = addressBook.find(e => e.address === recipient);
    return entry?.label;
  }, [addressBook, recipient]);

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  const handleSelectRecipient = (address: string) => {
    setRecipient(address);
  };

  const handleAddToAddressBook = () => {
    if (!recipient || !newLabel) return;
    addToAddressBook(recipient, newLabel);
    setAddressBook(getAddressBook());
    setNewLabel('');
    setShowAddToBook(false);
    toast.success('Added to address book');
  };

  const handleRemoveFromAddressBook = (address: string) => {
    removeFromAddressBook(address);
    setAddressBook(getAddressBook());
    toast.success('Removed from address book');
  };

  const handleConfirm = () => {
    if (!canTransfer) return;
    setStep('confirm');
  };

  const handleTransfer = async () => {
    if (!canTransfer || !wallet.stacksAddress) return;

    setStep('sending');
    setError(null);

    try {
      const result = await transferUSDCx(
        wallet.stacksAddress,
        recipient,
        amount,
        memo || undefined,
        'testnet'
      );

      if (result.success && result.txId) {
        setTxId(result.txId);
        setStep('success');
        toast.success('Transfer submitted!');
        
        // Refresh recent recipients
        setRecentRecipients(getRecentRecipients());
      } else {
        setError(result.error || 'Transfer failed');
        setStep('error');
        toast.error(result.error || 'Transfer failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMsg);
      setStep('error');
      toast.error(errorMsg);
    }
  };

  const handleReset = () => {
    setAmount('');
    setRecipient('');
    setMemo('');
    setStep('input');
    setTxId(null);
    setError(null);
  };

  const copyTxId = () => {
    if (txId) {
      navigator.clipboard.writeText(txId);
      toast.success('Transaction ID copied');
    }
  };

  // Not connected state
  if (!wallet.isConnected || !wallet.stacksAddress) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-lg mx-auto">
            <GlowCard className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Connect Stacks Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your Stacks wallet to transfer USDCx
              </p>
              <p className="text-sm text-muted-foreground">
                Use the wallet button in the header to connect
              </p>
            </GlowCard>
          </div>
        </section>
      </Layout>
    );
  }

  // Success state
  if (step === 'success' && txId) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <GlowCard className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Transfer Sent!</h2>
                <p className="text-muted-foreground mb-6">
                  {amount} USDCx sent to {recipient.slice(0, 8)}...{recipient.slice(-6)}
                </p>

                <div className="bg-surface-2 rounded-xl p-4 mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Transaction ID</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-sm font-mono">
                      {txId.slice(0, 12)}...{txId.slice(-8)}
                    </code>
                    <button onClick={copyTxId} className="p-1 hover:bg-surface-3 rounded">
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <a
                    href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    View on Explorer <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <Button onClick={handleReset} className="mt-6 gradient-primary">
                  Send More
                </Button>
              </GlowCard>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold mb-6 text-center">Transfer USDCx</h1>

            <GlowCard className="space-y-6">
              {/* Balance Display */}
              <div className="bg-surface-2 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Your Balance</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {wallet.stacksAddress?.slice(0, 8)}...{wallet.stacksAddress?.slice(-6)}
                  </span>
                </div>
                <p className="text-2xl font-bold">{formatAmount(balance)} USDCx</p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Amount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-xl font-bold bg-surface-2"
                    disabled={step !== 'input'}
                  />
                  <Button
                    variant="outline"
                    onClick={handleMaxAmount}
                    disabled={step !== 'input'}
                  >
                    MAX
                  </Button>
                </div>
                {parsedAmount > balance && (
                  <p className="text-red-500 text-sm">Insufficient balance</p>
                )}
              </div>

              {/* Recipient Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Recipient</label>
                  <button
                    onClick={() => setShowAddressBook(true)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <BookUser className="w-3 h-3" /> Address Book
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="ST... (Stacks address)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="font-mono text-sm bg-surface-2"
                  disabled={step !== 'input'}
                />
                {recipient && !isValidRecipient && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Invalid Stacks address
                  </p>
                )}
                {isSameAddress && (
                  <p className="text-yellow-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Cannot send to yourself
                  </p>
                )}
                {isValidRecipient && !isSameAddress && (
                  <div className="flex items-center justify-between">
                    <p className="text-green-500 text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 
                      {recipientLabel ? `${recipientLabel}` : 'Valid address'}
                    </p>
                    {!recipientLabel && (
                      <button
                        onClick={() => setShowAddToBook(true)}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Save
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Recipients */}
              {recentRecipients.length > 0 && step === 'input' && !recipient && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Recent</label>
                  <div className="flex flex-wrap gap-2">
                    {recentRecipients.slice(0, 3).map((r) => (
                      <button
                        key={r.address}
                        onClick={() => handleSelectRecipient(r.address)}
                        className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-xs font-mono transition-colors"
                      >
                        {r.label || `${r.address.slice(0, 6)}...${r.address.slice(-4)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Memo (Optional) */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Memo (Optional)</label>
                <Input
                  type="text"
                  placeholder="Add a note..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="bg-surface-2"
                  disabled={step !== 'input'}
                  maxLength={100}
                />
              </div>

              {/* Fee Estimate */}
              <div className="bg-surface-2 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span>~{estimateTransferFee()} STX</span>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {/* Action Button */}
              {step === 'input' && (
                <Button
                  onClick={handleConfirm}
                  disabled={!canTransfer}
                  className="w-full gradient-primary py-6 text-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Review Transfer
                </Button>
              )}

              {step === 'sending' && (
                <Button disabled className="w-full py-6 text-lg">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Confirm in Wallet...
                </Button>
              )}
            </GlowCard>
          </motion.div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={step === 'confirm'} onOpenChange={() => setStep('input')}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Transfer</DialogTitle>
              <DialogDescription>
                Review your transfer details before sending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-surface-2 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">{amount} USDCx</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono text-sm">
                    {recipientLabel || `${recipient.slice(0, 8)}...${recipient.slice(-6)}`}
                  </span>
                </div>
                {memo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memo</span>
                    <span className="text-sm">{memo}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee</span>
                  <span>~{estimateTransferFee()} STX</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransfer}
                  className="flex-1 gradient-primary"
                >
                  Confirm & Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Address Book Dialog */}
        <Dialog open={showAddressBook} onOpenChange={setShowAddressBook}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Address Book</DialogTitle>
              <DialogDescription>
                Select a saved address or add a new one
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-64 overflow-y-auto">
              {addressBook.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No saved addresses yet
                </p>
              ) : (
                addressBook.map((entry) => (
                  <div
                    key={entry.address}
                    className="flex items-center justify-between bg-surface-2 rounded-lg p-3"
                  >
                    <button
                      onClick={() => {
                        handleSelectRecipient(entry.address);
                        setShowAddressBook(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium">{entry.label}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {entry.address.slice(0, 12)}...{entry.address.slice(-8)}
                      </p>
                    </button>
                    <button
                      onClick={() => handleRemoveFromAddressBook(entry.address)}
                      className="p-2 hover:bg-surface-3 rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add to Address Book Dialog */}
        <Dialog open={showAddToBook} onOpenChange={setShowAddToBook}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Address</DialogTitle>
              <DialogDescription>
                Add this address to your address book
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm font-mono bg-surface-2 rounded-lg p-3">
                {recipient}
              </div>
              <Input
                placeholder="Label (e.g., John's Wallet)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddToBook(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToAddressBook}
                  disabled={!newLabel}
                  className="flex-1 gradient-primary"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
