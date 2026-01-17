import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  borderClassName?: string;
  active?: boolean;
}

export function AnimatedBorder({ 
  children, 
  className, 
  borderClassName,
  active = true 
}: AnimatedBorderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('relative group', className)}>
      {/* Animated gradient border */}
      {active && (
        <div
          className={cn(
            'absolute -inset-[2px] rounded-xl transition-opacity duration-300',
            prefersReducedMotion 
              ? 'opacity-60 bg-gradient-to-r from-primary via-accent to-primary'
              : 'opacity-80 blur-[3px] bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift group-hover:opacity-100',
            borderClassName
          )}
        />
      )}
      
      {/* Inner glow layer */}
      {active && !prefersReducedMotion && (
        <div
          className="absolute -inset-[1px] rounded-xl opacity-40 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 blur-md group-hover:opacity-60 transition-opacity"
        />
      )}
      
      {/* Inner content with solid background */}
      <div className="relative rounded-xl bg-card">
        {children}
      </div>
    </div>
  );
}
