import { cn } from '@/lib/utils';

interface TokenIconProps {
  token: 'usdc' | 'usdcx';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5 text-[8px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base',
};

export function TokenIcon({ token, size = 'md', className }: TokenIconProps) {
  const isUSDCx = token === 'usdcx';
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full font-bold',
        isUSDCx 
          ? 'bg-gradient-to-br from-stacks to-accent text-white' 
          : 'bg-[#2775CA] text-white',
        sizeClasses[size],
        className
      )}
    >
      <span className="relative z-10">$</span>
      {isUSDCx && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-stacks/50 to-accent/50 blur-sm -z-10" />
      )}
    </div>
  );
}
