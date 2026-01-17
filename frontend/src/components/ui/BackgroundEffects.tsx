import { cn } from '@/lib/utils';

interface BackgroundEffectsProps {
  variant?: 'default' | 'hero' | 'subtle';
  className?: string;
}

export function BackgroundEffects({ variant = 'default', className }: BackgroundEffectsProps) {
  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden', className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 animated-gradient-bg" />
      
      {/* Primary gradient orb - top left */}
      <div 
        className={cn(
          'absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[150px]',
          'bg-gradient-to-br from-primary/50 to-primary/10',
          variant === 'hero' ? 'opacity-50 animate-pulse-glow' : 'opacity-40'
        )}
      />
      
      {/* Accent gradient orb - bottom right */}
      <div 
        className={cn(
          'absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full blur-[150px]',
          'bg-gradient-to-br from-accent/40 to-accent/10',
          variant === 'hero' ? 'opacity-40 animate-pulse-glow' : 'opacity-30',
          variant === 'hero' && 'animation-delay-1000'
        )}
        style={{ animationDelay: '1s' }}
      />
      
      {variant === 'hero' && (
        <>
          {/* Ethereum orb */}
          <div 
            className="absolute top-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px] opacity-25 bg-ethereum animate-float"
          />
          {/* Stacks orb */}
          <div 
            className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] rounded-full blur-[120px] opacity-25 bg-stacks animate-float"
            style={{ animationDelay: '3s' }}
          />
          {/* Center glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-10 bg-gradient-radial from-primary via-transparent to-transparent"
          />
        </>
      )}

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 80%)',
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
