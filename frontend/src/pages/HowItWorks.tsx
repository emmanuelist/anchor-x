import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/GlowCard';
import { ChainIcon } from '@/components/ui/ChainIcon';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowRight, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Zap,
  Lock,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

const steps = [
  {
    number: 1,
    title: 'Connect Your Wallet',
    description: 'Link your Ethereum wallet to get started. We support all major wallets including MetaMask, WalletConnect, and Coinbase Wallet.',
    icon: Wallet,
    color: 'ethereum',
    details: [
      'No account creation required',
      'Your keys, your crypto',
      'Secure connection via Web3',
    ],
  },
  {
    number: 2,
    title: 'Enter Amount',
    description: 'Specify how much USDC you want to bridge to Stacks. See real-time fees and estimated arrival time before confirming.',
    icon: ArrowUpRight,
    color: 'primary',
    details: [
      'Transparent fee breakdown',
      'Live exchange rates',
      'Minimum: 10 USDC',
    ],
  },
  {
    number: 3,
    title: 'Confirm Transaction',
    description: 'Review the transaction details and approve it in your wallet. Your USDC is locked in our secure smart contract.',
    icon: Lock,
    color: 'accent',
    details: [
      'Audited smart contracts',
      'Multi-sig security',
      'Funds always recoverable',
    ],
  },
  {
    number: 4,
    title: 'Bridge Processing',
    description: 'Our decentralized network of validators confirms your transaction across both chains. Track progress in real-time.',
    icon: RefreshCw,
    color: 'stacks',
    details: [
      '12 block confirmations',
      'Cross-chain validation',
      'Average time: ~15 minutes',
    ],
  },
  {
    number: 5,
    title: 'Receive USDCx',
    description: 'Once confirmed, USDCx is minted on Stacks and sent directly to your wallet. Start using it in the Bitcoin DeFi ecosystem.',
    icon: CheckCircle2,
    color: 'success',
    details: [
      '1:1 backed by USDC',
      'Instant availability',
      'Ready for DeFi',
    ],
  },
];

const features = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Multi-layer security with audited smart contracts, multi-sig custody, and real-time monitoring.',
  },
  {
    icon: Clock,
    title: 'Fast Bridging',
    description: 'Average bridge time of 15 minutes with live status updates throughout the process.',
  },
  {
    icon: Zap,
    title: 'Low Fees',
    description: 'Only 0.25% bridge fee with competitive gas costs. No hidden charges.',
  },
];

export default function HowItWorks() {
  usePageMeta({
    title: 'How It Works',
    description: 'Learn how to bridge USDC from Ethereum to Stacks in 5 simple steps. Secure, fast, and easy cross-chain transfers.',
    canonicalPath: '/how-it-works',
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">Simple 5-Step Process</span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            How{' '}
            <span className="gradient-text">AnchorX</span>
            {' '}Works
          </h1>
          
          <p className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-8">
            Bridge your USDC from Ethereum to Stacks in minutes. Our secure, transparent process 
            ensures your assets are always safe.
          </p>

          {/* Chain visualization */}
          <motion.div 
            className="flex items-center justify-center gap-4 sm:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <ChainIcon chain="ethereum" size="lg" showGlow />
              <div className="text-left">
                <p className="font-semibold text-sm sm:text-base">Ethereum</p>
                <p className="text-xs text-muted-foreground">USDC</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <motion.div
                className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-ethereum to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </motion.div>
              <motion.div
                className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-transparent to-stacks"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <ChainIcon chain="stacks" size="lg" showGlow />
              <div className="text-left">
                <p className="font-semibold text-sm sm:text-base">Stacks</p>
                <p className="text-xs text-muted-foreground">USDCx</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Steps Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-ethereum via-primary to-stacks opacity-20 hidden sm:block" />

            <div className="space-y-6 sm:space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard 
                    className="relative pl-16 sm:pl-20"
                    glowColor={step.color as 'ethereum' | 'stacks' | 'primary'}
                  >
                    {/* Step number */}
                    <motion.div
                      className={`absolute left-3 sm:left-4 top-4 sm:top-6 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center z-10 ${
                        step.color === 'ethereum' ? 'bg-ethereum/20 text-ethereum border border-ethereum/30' :
                        step.color === 'stacks' ? 'bg-stacks/20 text-stacks border border-stacks/30' :
                        step.color === 'success' ? 'bg-success/20 text-success border border-success/30' :
                        'bg-primary/20 text-primary border border-primary/30'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.div>

                    <div className="py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Step {step.number}
                        </span>
                      </div>
                      
                      <h3 className="text-lg sm:text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm sm:text-base mb-4">
                        {step.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {step.details.map((detail, i) => (
                          <motion.span
                            key={i}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-surface-2 text-muted-foreground"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                          >
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            {detail}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Why Choose AnchorX?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Built for security, speed, and simplicity.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlowCard className="h-full text-center">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Token Comparison */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlowCard className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
                USDC → USDCx Conversion
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <TokenIcon token="usdc" size="lg" />
                    <ChainIcon chain="ethereum" size="sm" />
                  </div>
                  <p className="font-bold text-lg">USDC</p>
                  <p className="text-sm text-muted-foreground">on Ethereum</p>
                </div>

                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="hidden sm:block h-0.5 w-12 bg-gradient-to-r from-ethereum to-transparent" />
                  <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg bg-surface-2">
                    <span className="text-2xl font-bold gradient-text">1:1</span>
                    <span className="text-xs text-muted-foreground">Exchange Rate</span>
                  </div>
                  <div className="hidden sm:block h-0.5 w-12 bg-gradient-to-r from-transparent to-stacks" />
                </motion.div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <TokenIcon token="usdcx" size="lg" />
                    <ChainIcon chain="stacks" size="sm" />
                  </div>
                  <p className="font-bold text-lg">USDCx</p>
                  <p className="text-sm text-muted-foreground">on Stacks</p>
                </div>
              </div>

              <p className="text-center text-muted-foreground text-sm mt-6 sm:mt-8 max-w-md mx-auto">
                USDCx is fully backed 1:1 by USDC held in our audited smart contracts. 
                Redeem anytime at the same rate.
              </p>
            </GlowCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Ready to Bridge?
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
            Start bridging your USDC to Stacks in just a few clicks.
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-accent px-8 py-6 text-base sm:text-lg"
            >
              <Link to="/bridge">
                Start Bridging
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </Layout>
  );
}
