import { cn } from '@/lib/utils';
import stacksLogo from '@/assets/stacks-logo.jpg';

interface ChainIconProps {
  chain: 'ethereum' | 'stacks';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showGlow?: boolean;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  '2xl': 'h-20 w-20',
};

export function ChainIcon({ chain, size = 'md', className, showGlow = false }: ChainIconProps) {
  if (chain === 'ethereum') {
    return (
      <div 
        className={cn(
          'relative flex items-center justify-center rounded-full',
          showGlow && 'shadow-[0_0_20px_-5px_hsl(var(--ethereum)/0.6)]',
          sizeClasses[size],
          className
        )}
      >
        <svg
          viewBox="0 0 256 417"
          className={cn('h-full w-full', sizeClasses[size])}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638L127.961 0z"
            fill="hsl(var(--ethereum))"
            fillOpacity="0.8"
          />
          <path
            d="M127.962 0L0 212.32l127.962 75.639V154.158V0z"
            fill="hsl(var(--ethereum))"
          />
          <path
            d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587l-128.039 75.6z"
            fill="hsl(var(--ethereum))"
            fillOpacity="0.8"
          />
          <path
            d="M127.962 416.905v-104.72L0 236.585l127.962 180.32z"
            fill="hsl(var(--ethereum))"
          />
          <path
            d="M127.961 287.958l127.96-75.637-127.96-58.162v133.799z"
            fill="hsl(var(--ethereum))"
            fillOpacity="0.6"
          />
          <path
            d="M0 212.32l127.96 75.638V154.159L0 212.32z"
            fill="hsl(var(--ethereum))"
            fillOpacity="0.8"
          />
        </svg>
      </div>
    );
  }

  // Stacks icon - using actual logo
  return (
    <div 
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden',
        showGlow && 'shadow-[0_0_20px_-5px_hsl(var(--stacks)/0.6)]',
        sizeClasses[size],
        className
      )}
    >
      <img 
        src={stacksLogo} 
        alt="Stacks" 
        className="h-full w-full object-cover"
      />
    </div>
  );
}
