import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlowCard } from '@/components/ui/GlowCard';
import { ChainIcon } from '@/components/ui/ChainIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import { TransactionDetailTimeline } from '@/components/ui/TransactionDetailTimeline';
import { TransactionsSkeleton } from '@/components/ui/TransactionsSkeleton';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWallet } from '@/contexts/WalletContext';
import { formatAmount, getTimeAgo, getExplorerUrl } from '@/lib/data';
import { syncFromBlockchain } from '@/lib/bridge';
import { Search, ArrowRight, ExternalLink, ChevronDown, RefreshCw, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePageMeta } from '@/hooks/usePageMeta';
import { toast } from 'sonner';

type Filter = 'all' | 'deposit' | 'withdraw';
type StatusFilter = 'all' | 'pending' | 'confirming' | 'completed' | 'failed';

export default function Transactions() {
  usePageMeta({
    title: 'Transaction History',
    description: 'View and track all your USDC bridge transactions. Filter by type, status, and search by hash or address.',
    canonicalPath: '/transactions',
  });

  const { transactions, wallet, refreshTransactions } = useWallet();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Filter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get wallet addresses
  const ethAddress = wallet.ethereumAddress;
  const stxAddress = wallet.stacksAddress;

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSyncFromBlockchain = useCallback(async () => {
    if (!ethAddress && !stxAddress) {
      toast.error('Connect a wallet to sync transactions');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncFromBlockchain(ethAddress, stxAddress, 'testnet');
      
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} transaction${result.synced !== 1 ? 's' : ''} from blockchain`);
        // Refresh transactions list
        refreshTransactions?.();
      } else {
        toast.info('No new transactions found on blockchain');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync from blockchain');
    } finally {
      setIsSyncing(false);
    }
  }, [ethAddress, stxAddress, refreshTransactions]);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.txHash.toLowerCase().includes(q) ||
        tx.fromAddress.toLowerCase().includes(q) ||
        tx.toAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export transactions to CSV
  const handleExportCSV = useCallback(() => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Token', 'Status', 'From', 'To', 'Tx Hash', 'Fee'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.timestamp).toISOString(),
      tx.type,
      tx.amount.toString(),
      tx.type === 'deposit' ? 'USDC→USDCx' : 'USDCx→USDC',
      tx.status,
      tx.fromAddress,
      tx.toAddress,
      tx.txHash,
      tx.fee?.toString() || '0',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anchorx-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} to CSV`);
  }, [filteredTransactions]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
          <TransactionsSkeleton />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Transactions</h1>
            <div className="flex items-center gap-2">
              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  'bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                title="Export transactions to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              {/* Sync from Blockchain Button */}
              <button
                onClick={handleSyncFromBlockchain}
                disabled={isSyncing || (!ethAddress && !stxAddress)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  'bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                title="Sync transaction history from blockchain"
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4 sm:mb-6" role="search" aria-label="Transaction filters">
            {/* Search - full width */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by hash or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:pl-10 bg-surface-1 h-9 sm:h-10 text-sm"
                aria-label="Search transactions by hash or address"
              />
            </div>

            {/* Filter buttons - scrollable on mobile */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
              {/* Type filters */}
              <div className="flex gap-1.5 shrink-0" role="group" aria-label="Filter by transaction type">
                {(['all', 'deposit', 'withdraw'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    aria-pressed={typeFilter === f}
                    className={cn(
                      'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors capitalize min-h-[36px] sm:min-h-[40px] whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      typeFilter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f === 'all' ? 'All types' : f}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px bg-border/50 shrink-0 hidden sm:block" aria-hidden="true" />

              {/* Status filters */}
              <div className="flex gap-1.5 shrink-0" role="group" aria-label="Filter by transaction status">
                {(['all', 'pending', 'confirming', 'completed', 'failed'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={statusFilter === s}
                    className={cn(
                      'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors capitalize min-h-[36px] sm:min-h-[40px] whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      statusFilter === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {s === 'all' ? 'All statuses' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div 
            className="space-y-2.5 sm:space-y-3" 
            role="list" 
            aria-label={`${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} found`}
            aria-live="polite"
          >
            {filteredTransactions.length === 0 ? (
              <GlowCard className="text-center py-8 sm:py-10" hover={false} role="status">
                <p className="text-muted-foreground text-sm">No transactions found</p>
              </GlowCard>
            ) : (
              filteredTransactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Collapsible
                    open={expandedId === tx.id}
                    onOpenChange={(open) => setExpandedId(open ? tx.id : null)}
                  >
                    <GlowCard className="space-y-2.5 sm:space-y-3 p-3 sm:p-4" hover={false}>
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                              <ChainIcon chain={tx.fromChain} size="sm" />
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <ChainIcon chain={tx.toChain} size="sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm lg:text-base truncate font-mono">
                                {formatAmount(tx.amount)} {tx.type === 'deposit' ? 'USDC' : 'USDCx'}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {tx.type} • {getTimeAgo(tx.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={tx.status} size="sm" />
                            <motion.div
                              animate={{ rotate: expandedId === tx.id ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Addresses - stack on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-border/50 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-0.5">From</p>
                          <AddressDisplay address={tx.fromAddress} chain={tx.fromChain} showExternalLink />
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-0.5">To</p>
                          <AddressDisplay address={tx.toAddress} chain={tx.toChain} showExternalLink />
                        </div>
                      </div>

                      {/* Fee & explorer - stack on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-border/50 text-xs">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-muted-foreground">
                            Fee: ${formatAmount(tx.fee + tx.gasFee)}
                          </span>
                          {tx.status === 'confirming' && (
                            <span className="text-muted-foreground">
                              Confirmations: {tx.confirmations}/{tx.requiredConfirmations}
                            </span>
                          )}
                        </div>
                        <a
                          href={getExplorerUrl(tx.fromChain, tx.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline min-h-[36px] sm:min-h-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      {/* Expandable Detail Section */}
                      <CollapsibleContent>
                        <AnimatePresence>
                          {expandedId === tx.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pt-3 sm:pt-4 border-t border-border/50"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Timeline */}
                                <TransactionDetailTimeline transaction={tx} />
                                
                                {/* Details Panel */}
                                <div className="space-y-4 sm:space-y-6">
                                  {/* Fee Breakdown */}
                                  <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                      Fee Breakdown
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bridge Fee (0.25%)</span>
                                        <span>${formatAmount(tx.fee)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Gas Fee</span>
                                        <span>${formatAmount(tx.gasFee)}</span>
                                      </div>
                                      <div className="flex justify-between pt-2 border-t border-border/50 font-medium">
                                        <span>Total Fees</span>
                                        <span>${formatAmount(tx.fee + tx.gasFee)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Transaction Hashes */}
                                  <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                      Transaction Hashes
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                      <div>
                                        <p className="text-muted-foreground mb-1">Source Chain</p>
                                        <a
                                          href={getExplorerUrl(tx.fromChain, tx.txHash)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs break-all"
                                        >
                                          {tx.txHash.slice(0, 20)}...{tx.txHash.slice(-8)}
                                          <ExternalLink className="h-3 w-3 shrink-0" />
                                        </a>
                                      </div>
                                      {tx.destinationTxHash && (
                                        <div>
                                          <p className="text-muted-foreground mb-1">Destination Chain</p>
                                          <a
                                            href={getExplorerUrl(tx.toChain, tx.destinationTxHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs break-all"
                                          >
                                            {tx.destinationTxHash.slice(0, 20)}...{tx.destinationTxHash.slice(-8)}
                                            <ExternalLink className="h-3 w-3 shrink-0" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CollapsibleContent>
                    </GlowCard>
                  </Collapsible>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
