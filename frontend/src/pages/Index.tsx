import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/GlowCard';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ParticleField } from '@/components/ui/ParticleField';
import { TransactionTicker } from '@/components/ui/TransactionTicker';
import { HeroChainVisualization } from '@/components/ui/HeroChainVisualization';
import { bridgeStats, mockTransactions, formatAmount, getTimeAgo, networkStatus } from '@/lib/mockData';
import { ArrowRight, Shield, Zap, RefreshCw, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChainIcon } from '@/components/ui/ChainIcon';
import { cn } from '@/lib/utils';
import { usePageMeta } from '@/hooks/usePageMeta';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Bridge your USDC in under 15 minutes with optimized transaction routing.',
    color: 'primary' as const,
  },
  {
    icon: Shield,
    title: 'Battle-Tested Security',
    description: 'Multi-sig custody and audited smart contracts protect your assets.',
    color: 'success' as const,
  },
  {
    icon: RefreshCw,
    title: 'Bi-Directional',
    description: 'Seamlessly move between Ethereum and Stacks in either direction.',
    color: 'ethereum' as const,
  },
  {
    icon: Lock,
    title: '1:1 Backed',
    description: 'Every USDCx is backed by real USDC held in Circle-verified reserves.',
    color: 'stacks' as const,
  },
];

export default function Index() {
  usePageMeta({
    title: 'Bridge USDC to Bitcoin DeFi',
    description: 'The fastest, most secure way to bridge USDC from Ethereum to Stacks. Access Bitcoin-powered DeFi with Circle-backed stablecoins.',
    canonicalPath: '/',
  });

  const recentTxs = mockTransactions.slice(0, 5);

  return (
    <Layout backgroundVariant="hero">
      {/* Particle Field Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleField particleCount={60} />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border border-success/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-sm text-muted-foreground">All systems operational</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              Bridge USDC to{' '}
              <span className="gradient-text block sm:inline">Bitcoin's DeFi</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              The fastest, most secure way to bring your USDC into the Stacks ecosystem. 
              Unlock Bitcoin-powered DeFi with Circle-backed stablecoins.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-5 lg:py-6 glow group"
                  data-onboarding="hero-cta"
                >
                  <Link to="/bridge">
                    Start Bridging 
                    <ChevronRight className="ml-1 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
              <Button asChild variant="outline" size="lg" className="text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-4 sm:py-5 lg:py-6 border-border/50 hover:bg-surface-2">
                <Link to="/faq">Learn More</Link>
              </Button>
            </div>
          </motion.div>

          {/* Enhanced Chain Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroChainVisualization />
          </motion.div>
        </div>
      </section>

      {/* Transaction Ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <TransactionTicker />
      </motion.div>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[
            { label: 'Total Value Bridged', value: bridgeStats.totalValueBridged, prefix: '$', formatCompact: true },
            { label: 'Transactions', value: bridgeStats.totalTransactions, formatCompact: true },
            { label: 'Avg Bridge Time', value: bridgeStats.avgBridgeTime, suffix: ' min' },
            { label: 'Active Users', value: bridgeStats.activeUsers, formatCompact: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + 0.1 * i }}
            >
              <GlowCard className="text-center py-3 sm:py-4 lg:py-6 px-2 sm:px-3 group hover:scale-[1.02] transition-transform duration-300">
                <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1 font-mono">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    formatCompact={stat.formatCompact}
                  />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <motion.div 
          className="text-center mb-8 sm:mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Why AnchorX?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
            Built for serious DeFi users who demand security, speed, and reliability.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, i) => {
            const colorClasses = {
              primary: { bg: 'bg-primary/10', text: 'text-primary' },
              success: { bg: 'bg-success/10', text: 'text-success' },
              ethereum: { bg: 'bg-ethereum/10', text: 'text-ethereum' },
              stacks: { bg: 'bg-stacks/10', text: 'text-stacks' },
            };
            const colors = colorClasses[feature.color];
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                <GlowCard 
                  className="h-full group hover:scale-[1.02] transition-all duration-300" 
                  glowColor={feature.color}
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300', colors.bg)}>
                    <feature.icon className={cn('h-6 w-6', colors.text)} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Live Feed Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">Live Transaction Feed</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Real-time bridge activity</p>
          </div>
          <Link 
            to="/transactions" 
            className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 group self-start sm:self-auto"
          >
            View all 
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="space-y-2 sm:space-y-3">
          {recentTxs.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <GlowCard 
                className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 hover:scale-[1.01] transition-transform" 
                hover={false}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <ChainIcon chain={tx.fromChain} size="sm" />
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <ChainIcon chain={tx.toChain} size="sm" />
                  </div>
                  <div>
                    <p className="font-semibold font-mono text-sm sm:text-base">{formatAmount(tx.amount)} {tx.fromChain === 'ethereum' ? 'USDC' : 'USDCx'}</p>
                    <p className="text-xs text-muted-foreground">{getTimeAgo(tx.timestamp)}</p>
                  </div>
                </div>
                <StatusBadge status={tx.status} size="sm" />
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Network Status */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <motion.div 
          className="text-center mb-6 sm:mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Network Status</h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
          {networkStatus.map((network, i) => (
            <motion.div
              key={network.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
            >
              <GlowCard className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-5" hover={false}>
                <StatusBadge status={network.status} showText={false} size="sm" />
                <span className="font-medium text-sm sm:text-base">{network.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{network.latency}ms</span>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <GlowCard className="max-w-2xl mx-auto py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Ready to Bridge?</h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
              Join thousands of users bridging USDC to Bitcoin's DeFi ecosystem.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-accent px-6 sm:px-8 py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg min-h-[48px]"
            >
              <Link to="/bridge">
                Launch App <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </GlowCard>
        </motion.div>
      </section>
    </Layout>
  );
}
