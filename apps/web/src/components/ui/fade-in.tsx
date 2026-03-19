'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  /** Delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Y offset to slide from (px) */
  y?: number;
  className?: string;
}

/**
 * Fade-in + slide-up entrance animation.
 * Uses transform + opacity only (GPU-accelerated, no layout shift).
 * Respects prefers-reduced-motion via framer-motion defaults.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  y = 24,
  className,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier ease-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  /** Base delay before first child animates (seconds) */
  baseDelay?: number;
  /** Stagger delay between each child (seconds) */
  stagger?: number;
  className?: string;
}

/**
 * Container that staggers its children's entrance animations.
 * Wrap FadeIn children inside this for sequential reveal.
 */
export function StaggerContainer({
  children,
  baseDelay = 0,
  stagger = 0.08,
  className,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: baseDelay,
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Child item for use inside StaggerContainer.
 * Automatically picks up stagger timing from parent.
 */
export function StaggerItem({
  children,
  className,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
