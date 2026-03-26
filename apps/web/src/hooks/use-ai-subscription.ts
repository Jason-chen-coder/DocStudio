'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { aiSubscriptionService, type AiSubscriptionInfo } from '@/services/ai-subscription-service';
import { useAuth } from '@/lib/auth-context';
import type { AiCommand } from '@/services/ai-service';

export interface AiSubscriptionState {
  subscription: AiSubscriptionInfo | null;
  loading: boolean;
  isSubscribed: boolean;
  isSuperAdmin: boolean;
  canUseCommand: (command: AiCommand | string) => boolean;
  canUseCopilot: boolean;
  canUseChat: boolean;
  refresh: () => void;
}

/**
 * Hook that provides the current user's AI subscription state.
 * SuperAdmins bypass all subscription checks.
 */
export function useAiSubscription(): AiSubscriptionState {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AiSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = !!user?.isSuperAdmin;

  const load = useCallback(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    aiSubscriptionService
      .getMySubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isSubscribed = isSuperAdmin || !!subscription;

  const canUseCommand = useCallback(
    (command: AiCommand | string): boolean => {
      if (isSuperAdmin) return true;
      if (!subscription) return false;
      return subscription.allowedCommands.includes(command);
    },
    [isSuperAdmin, subscription],
  );

  const canUseCopilot = isSuperAdmin || (!!subscription?.features?.copilot);
  const canUseChat = isSuperAdmin || (!!subscription?.features?.chat);

  return useMemo(
    () => ({
      subscription,
      loading,
      isSubscribed,
      isSuperAdmin,
      canUseCommand,
      canUseCopilot,
      canUseChat,
      refresh: load,
    }),
    [subscription, loading, isSubscribed, isSuperAdmin, canUseCommand, canUseCopilot, canUseChat, load],
  );
}
