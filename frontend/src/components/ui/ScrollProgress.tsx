import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // Initial call
    
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  const isVisible = progress > 0;

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent pointer-events-none transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div
        className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)] transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
