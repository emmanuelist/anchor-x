import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  duration?: number;
}

const COLORS = [
  'hsl(239, 84%, 67%)', // Primary
  'hsl(263, 70%, 58%)', // Accent
  'hsl(142, 76%, 45%)', // Success
  'hsl(225, 58%, 66%)', // Ethereum
  'hsl(249, 100%, 58%)', // Stacks
  'hsl(38, 92%, 50%)', // Warning/Gold
];

export function ConfettiCelebration({ isActive, duration = 3000 }: ConfettiCelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    if (isActive) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          rotation: Math.random() * 360,
          size: Math.random() * 8 + 4,
        });
      }
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                top: -20,
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                borderRadius: piece.size > 8 ? '2px' : '1px',
              }}
              initial={{
                y: -20,
                rotate: piece.rotation,
                opacity: 1,
              }}
              animate={{
                y: window.innerHeight + 100,
                rotate: piece.rotation + 720,
                opacity: 0,
              }}
              transition={{
                duration: 3,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
