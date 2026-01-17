import { cn } from '@/lib/utils';
import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'accent' | 'ethereum' | 'stacks' | 'success';
  hover?: boolean;
  onClick?: () => void;
  tilt?: boolean;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
}

const glowColorClasses = {
  primary: 'group-hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.5)]',
  accent: 'group-hover:shadow-[0_0_40px_-5px_hsl(var(--accent)/0.5)]',
  ethereum: 'group-hover:shadow-[0_0_40px_-5px_hsl(var(--ethereum)/0.5)]',
  stacks: 'group-hover:shadow-[0_0_40px_-5px_hsl(var(--stacks)/0.5)]',
  success: 'group-hover:shadow-[0_0_40px_-5px_hsl(var(--success)/0.5)]',
};

const borderGlowClasses = {
  primary: 'group-hover:border-primary/40',
  accent: 'group-hover:border-accent/40',
  ethereum: 'group-hover:border-ethereum/40',
  stacks: 'group-hover:border-stacks/40',
  success: 'group-hover:border-success/40',
};

export function GlowCard({ 
  children, 
  className, 
  glowColor = 'primary',
  hover = true,
  onClick,
  tilt = false,
  role,
  'aria-label': ariaLabel,
  tabIndex,
}: GlowCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device and disable tilt
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const shouldTilt = tilt && !isTouchDevice;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!shouldTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateXValue = ((y - centerY) / centerY) * -5;
    const rotateYValue = ((x - centerX) / centerX) * 5;
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const CardComponent = shouldTilt ? motion.div : 'div';
  const cardProps = shouldTilt ? {
    style: { 
      rotateX, 
      rotateY,
      transformStyle: 'preserve-3d' as const,
    },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  } : {};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <CardComponent
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={role || (onClick ? 'button' : undefined)}
      aria-label={ariaLabel}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      className={cn(
        'group glass rounded-xl p-4 sm:p-6 transition-all duration-300',
        hover && glowColorClasses[glowColor],
        hover && borderGlowClasses[glowColor],
        hover && 'hover:-translate-y-1',
        onClick && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      {...cardProps}
    >
      {children}
    </CardComponent>
  );
}
