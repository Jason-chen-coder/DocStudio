'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra classes for the panel container */
  className?: string;
  /** z-index class, default z-50 */
  zIndex?: string;
}

/**
 * Reusable animated modal wrapper.
 * Provides backdrop fade + panel scale/slide enter/exit animation.
 * Usage:
 *   <AnimatedModal open={isOpen} onClose={handleClose}>
 *     <div className="...your panel styles...">content</div>
 *   </AnimatedModal>
 */
export function AnimatedModal({
  open,
  onClose,
  children,
  className = '',
  zIndex = 'z-50',
}: AnimatedModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`transition-all duration-200 ease-out ${
          visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        } ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
