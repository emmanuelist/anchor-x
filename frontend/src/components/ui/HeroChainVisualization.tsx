import { motion } from 'framer-motion';
import { ChainIcon } from './ChainIcon';

export function HeroChainVisualization() {
  return (
    <div className="relative flex items-center justify-center gap-6 sm:gap-10 md:gap-16 py-4 sm:py-6 md:py-8">
      {/* Ethereum Side */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative"
      >
        {/* Pulse rings - responsive sizes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="absolute w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border border-ethereum/30"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border border-ethereum/20"
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
        </div>
        
        <div className="relative z-10 text-center">
          <ChainIcon chain="ethereum" size="2xl" showGlow className="mx-auto mb-2 sm:mb-4" />
          <p className="font-semibold text-sm sm:text-base md:text-lg">Ethereum</p>
          <p className="text-xs sm:text-sm text-ethereum">USDC</p>
        </div>
      </motion.div>

      {/* Connecting Bridge Animation - responsive width */}
      <div className="relative w-16 sm:w-24 md:w-32 h-12 sm:h-14 md:h-16">
        {/* Static line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-ethereum via-primary to-stacks opacity-30" />
        
        {/* Animated flowing dots */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-ethereum to-stacks"
            initial={{ left: '0%', opacity: 0 }}
            animate={{ 
              left: ['0%', '100%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Center bridge icon - responsive size */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <svg
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Stacks Side */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative"
      >
        {/* Pulse rings - responsive sizes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="absolute w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border border-stacks/30"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.25 }}
          />
          <motion.div
            className="absolute w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border border-stacks/20"
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.75 }}
          />
        </div>
        
        <div className="relative z-10 text-center">
          <ChainIcon chain="stacks" size="2xl" showGlow className="mx-auto mb-2 sm:mb-4" />
          <p className="font-semibold text-sm sm:text-base md:text-lg">Stacks</p>
          <p className="text-xs sm:text-sm text-stacks">USDCx</p>
        </div>
      </motion.div>
    </div>
  );
}
