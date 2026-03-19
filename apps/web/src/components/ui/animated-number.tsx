'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;  // ms per digit column, default 1600
  className?: string;
}

/**
 * Slot-machine / odometer style rolling number.
 * Each digit column scrolls independently with staggered timing.
 * Uses CSS transform (GPU) for 60fps. Respects prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  duration = 1600,
  className = '',
}: AnimatedNumberProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasAnimated = useRef(false);

  // Respect reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches && !hasAnimated.current) {
      // Small delay so initial render shows "0" then rolls to target
      const t = setTimeout(() => {
        setShouldAnimate(true);
        hasAnimated.current = true;
      }, 100);
      return () => clearTimeout(t);
    } else {
      setShouldAnimate(true);
      hasAnimated.current = true;
    }
  }, []);

  // Re-trigger on value change
  useEffect(() => {
    if (hasAnimated.current) {
      setShouldAnimate(true);
    }
  }, [value]);

  const digits = useMemo(() => {
    const str = String(Math.max(0, value));
    return str.split('').map((d) => parseInt(d, 10));
  }, [value]);

  const totalDigits = digits.length;

  return (
    <span
      className={`inline-flex items-baseline overflow-hidden ${className}`}
      aria-label={String(value)}
    >
      {digits.map((digit, i) => (
        <DigitColumn
          key={`${totalDigits}-${i}`}
          digit={shouldAnimate ? digit : 0}
          duration={duration}
          delay={i * 120}
        />
      ))}
    </span>
  );
}

// ─── Single digit column ───

function DigitColumn({
  digit,
  duration,
  delay,
}: {
  digit: number;
  duration: number;
  delay: number;
}) {
  const colRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = colRef.current;
    if (!el) return;

    // Each digit is 1em tall; translate to show the target digit
    const target = -digit * 100; // percentage

    el.style.transition = 'none';
    el.style.transform = 'translateY(0%)';

    // Force reflow
    void el.offsetHeight;

    el.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
    el.style.transform = `translateY(${target}%)`;
  }, [digit, duration, delay]);

  return (
    <span
      className="relative inline-block"
      style={{ width: '0.65em', height: '1em', lineHeight: 1 }}
    >
      <span
        ref={colRef}
        className="absolute left-0 top-0 flex flex-col tabular-nums"
        style={{ width: '0.65em' }}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="flex items-center justify-center"
            style={{ height: '1em', lineHeight: 1 }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
