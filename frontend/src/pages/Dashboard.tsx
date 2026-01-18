import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/GlowCard';
import { ChainIcon } from '@/components/ui/ChainIcon';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import { Sparkline } from '@/components/ui/Sparkline';
import { PortfolioChart } from '@/components/ui/PortfolioChart';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { useWallet } from '@/contexts/WalletContext';
import { formatAmount, getTimeAgo, fetchNetworkStatus, type NetworkStatus } from '@/lib/data';
import { ArrowUpRight, ArrowDownLeft, Wallet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Dashboard() {
  usePageMeta({
    title: 'Dashboard',
    description: 'View your USDC and USDCx balances, recent transactions, and network status. Manage your cross-chain portfolio.',
    canonicalPath: '/dashboard',
  });

  const { wallet, transactions, connectWallet, isConnecting } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus[]>([]);
  
  // Generate sparkline data from balance history (simulated from current balance)
  // In production, this would come from historical balance tracking
  const [sparklineData, setSparklineData] = useState({
    usdc: [100, 100, 100, 100, 100, 100, 100, 100],
    usdcx: [100, 100, 100, 100, 100, 100, 100, 100],
  });

  // Fetch network status
  useEffect(() => {
    const loadNetworkStatus = async () => {
      try {
        const status = await fetchNetworkStatus('testnet');
        setNetworkStatus(status);
      } catch (error) {
        console.error('Failed to fetch network status:', error);
      }
    };
    loadNetworkStatus();
    const interval = setInterval(loadNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update sparkline data when balance changes
  useEffect(() => {
    if (wallet.isConnected) {
      // Create sparkline based on current balance (normalized to show variation)
      const baseUsdc = wallet.usdcBalance || 100;
      const baseUsdcx = wallet.usdcxBalance || 100;
      setSparklineData({
        usdc: Array(8).fill(0).map((_, i) => baseUsdc * (0.95 + Math.random() * 0.1)),
        usdcx: Array(8).fill(0).map((_, i) => baseUsdcx * (0.95 + Math.random() * 0.1)),
      });
    }
  }, [wallet.usdcBalance, wallet.usdcxBalance, wallet.isConnected]);

  // Simulate loading state
  useEffect(() => {
    if (wallet.isConnected) {
      const timer = setTimeout(() => setIsLoading(false), 1200);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [wallet.isConnected]);

  const userTransactions = transactions.filter(tx => 
    tx.fromAddress === wallet.ethereumAddress || tx.fromAddress === wallet.stacksAddress
  ).slice(0, 5);

  // Calculate percentage change from first to last value in sparkline
  const calculateChange = (data: number[]) => {
    if (data.length < 2 || data[0] === 0) return 0;
    return ((data[data.length - 1] - data[0]) / data[0]) * 100;
  };
  const usdcChange = calculateChange(sparklineData.usdc);
  const usdcxChange = calculateChange(sparklineData.usdcx);

  if (!wallet.isConnected) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
          <motion.div 
            className="max-w-md mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-glow">
              <Wallet className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">
              Connect your wallet to view your balances, transactions, and bridge history.
            </p>
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg"
            >
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </motion.div>
        </section>
      </Layout>
    );
  }

  const totalBalance = wallet.usdcBalance + wallet.usdcxBalance;

  // Show skeleton while loading
  if (isLoading && wallet.isConnected) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
          <DashboardSkeleton />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>

          {/* Balance Cards */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Ethereum USDC Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlowCard glowColor="ethereum" className="h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ChainIcon chain="ethereum" size="md" showGlow />
                    <div>
                      <p className="text-sm text-muted-foreground">Ethereum</p>
                      <AddressDisplay address={wallet.ethereumAddress || ''} chain="ethereum" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Sparkline 
                      data={sparklineData.usdc} 
                      color="ethereum" 
                      width={80} 
                      height={32} 
                    />
                    <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${usdcChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {usdcChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{Math.abs(usdcChange).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <TokenIcon token="usdc" size="md" />
                  <div>
                    <p className="text-base sm:text-lg lg:text-xl font-bold font-mono">
                      <AnimatedCounter value={wallet.usdcBalance} decimals={2} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">USDC</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>

            {/* Stacks USDCx Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlowCard glowColor="stacks" className="h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ChainIcon chain="stacks" size="md" showGlow />
                    <div>
                      <p className="text-sm text-muted-foreground">Stacks</p>
                      <AddressDisplay address={wallet.stacksAddress || ''} chain="stacks" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Sparkline 
                      data={sparklineData.usdcx} 
                      color="stacks" 
                      width={80} 
                      height={32} 
                    />
                    <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${usdcxChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {usdcxChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{Math.abs(usdcxChange).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <TokenIcon token="usdcx" size="md" />
                  <div>
                    <p className="text-base sm:text-lg lg:text-xl font-bold font-mono">
                      <AnimatedCounter value={wallet.usdcxBalance} decimals={2} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">USDCx</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </div>

          {/* Total & Quick Actions */}
          <motion.div 
            className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlowCard className="sm:col-span-1">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total Portfolio</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono">
                $<AnimatedCounter value={totalBalance} decimals={2} />
              </p>
              <div className="mt-2 sm:mt-3">
                <PortfolioChart 
                  usdcBalance={wallet.usdcBalance} 
                  usdcxBalance={wallet.usdcxBalance} 
                />
              </div>
            </GlowCard>

            <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  className="w-full min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] bg-gradient-to-r from-ethereum to-primary flex-col gap-1 sm:gap-2 py-4 sm:py-5 text-xs sm:text-sm lg:text-base"
                >
                  <Link to="/bridge">
                    <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                    <span>Deposit</span>
                    <span className="text-[10px] sm:text-xs opacity-80">ETH → STX</span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  className="w-full min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] bg-gradient-to-r from-stacks to-accent flex-col gap-1 sm:gap-2 py-4 sm:py-5 text-xs sm:text-sm lg:text-base"
                >
                  <Link to="/bridge">
                    <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                    <span>Withdraw</span>
                    <span className="text-[10px] sm:text-xs opacity-80">STX → ETH</span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div 
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold">Recent Transactions</h2>
              <Link to="/transactions" className="text-primary text-xs sm:text-sm hover:underline flex items-center gap-1 group">
                View all <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {userTransactions.length === 0 ? (
              <GlowCard className="text-center py-8 sm:py-10 lg:py-12" hover={false}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-base sm:text-lg mb-3 sm:mb-4">No transactions yet</p>
                <Button asChild className="bg-gradient-to-r from-primary to-accent min-h-[44px]">
                  <Link to="/bridge">Make your first bridge</Link>
                </Button>
              </GlowCard>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {userTransactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <GlowCard className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 hover:scale-[1.01] transition-transform" hover={false}>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <ChainIcon chain={tx.fromChain} size="sm" />
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <ChainIcon chain={tx.toChain} size="sm" />
                        </div>
                        <div>
                          <p className="font-semibold font-mono text-sm sm:text-base">{formatAmount(tx.amount)} {tx.type === 'deposit' ? 'USDC' : 'USDCx'}</p>
                          <p className="text-xs text-muted-foreground">{getTimeAgo(tx.timestamp)}</p>
                        </div>
                      </div>
                      <StatusBadge status={tx.status} size="sm" />
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Network Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Network Status</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {networkStatus.map((net, i) => (
                <motion.div
                  key={net.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + 0.1 * i }}
                >
                  <GlowCard className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4" hover={false}>
                    <StatusBadge status={net.status} showText={false} size="sm" />
                    <span className="font-medium text-sm sm:text-base">{net.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{net.latency}ms</span>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </Layout>
  );
}
