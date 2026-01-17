import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Loader2, XCircle, AlertCircle } from 'lucide-react';

type Status = 'pending' | 'confirming' | 'completed' | 'failed' | 'operational' | 'degraded' | 'down';

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: typeof CheckCircle2;
  animate?: string;
}> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-warning/20',
    textColor: 'text-warning',
    icon: Clock,
    animate: 'animate-pulse',
  },
  confirming: {
    label: 'Confirming',
    bgColor: 'bg-primary/20',
    textColor: 'text-primary',
    icon: Loader2,
    animate: 'animate-spin',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-success/20',
    textColor: 'text-success',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-destructive/20',
    textColor: 'text-destructive',
    icon: XCircle,
  },
  operational: {
    label: 'Operational',
    bgColor: 'bg-success/20',
    textColor: 'text-success',
    icon: CheckCircle2,
  },
  degraded: {
    label: 'Degraded',
    bgColor: 'bg-warning/20',
    textColor: 'text-warning',
    icon: AlertCircle,
    animate: 'animate-pulse',
  },
  down: {
    label: 'Down',
    bgColor: 'bg-destructive/20',
    textColor: 'text-destructive',
    icon: XCircle,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StatusBadge({ 
  status, 
  className, 
  showIcon = true,
  showText = true,
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], config.animate)} aria-hidden="true" />
      )}
      {showText && <span>{config.label}</span>}
    </span>
  );
}
