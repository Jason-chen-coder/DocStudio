'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { cn } from '@/lib/utils';

export function GlobalLoading() {
  const { isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isLoading && !isVisible) {
      // eslint-disable-next-line
      setIsVisible(true);
    } else if (!isLoading && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isVisible]);

  if (!isVisible) return null;

  return (
    <LoadingScreen 
      className={cn(
        "transition-opacity duration-300 ease-out",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )} 
    />
  );
}
