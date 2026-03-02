'use client';

import { useEffect, useRef, useState } from 'react';
import { HocuspocusProvider } from '@hocuspocus/provider';
import type * as Y from 'yjs'; // type-only import, no runtime Yjs
import { getToken } from '@/lib/api';

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string | null;
}

export type CollabStatus = 'connecting' | 'connected' | 'disconnected';

// Generate a stable, visually distinct color for a user based on their ID
export function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#82E0AA', '#F0B27A',
  ];
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}

interface UseCollaborationOptions {
  documentId: string;
  ydocKey: string;
  currentUser: CollabUser;
}

interface UseCollaborationReturn {
  ydoc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  connectedUsers: CollabUser[];
  status: CollabStatus;
}

export function useCollaboration(
  options: UseCollaborationOptions | null,
): UseCollaborationReturn {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);
  const [status, setStatus] = useState<CollabStatus>('connecting');

  const providerRef = useRef<HocuspocusProvider | null>(null);

  const documentId = options?.documentId ?? null;
  const ydocKey = options?.ydocKey ?? null;
  const currentUser = options?.currentUser ?? null;

  useEffect(() => {
    if (!ydocKey || !documentId || !currentUser) return;

    const token = getToken();
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1234';

    // Create HocuspocusProvider WITHOUT passing a custom Y.Doc.
    // The provider creates its own Y.Doc internally, guaranteeing that
    // `provider.document` uses the SAME Yjs instance as @hocuspocus/provider.
    // This avoids the "Yjs was already imported" duplicate-instance error
    // that occurs when we import Yjs ourselves and pass a foreign Y.Doc.
    const hp = new HocuspocusProvider({
      url: wsUrl,
      name: ydocKey,
      token: token ?? '',

      onStatus({ status: s }) {
        if (s === 'connected') setStatus('connected');
        else if (s === 'disconnected') setStatus('disconnected');
        else setStatus('connecting');
      },

      onConnect() {
        setStatus('connected');
      },

      onDisconnect() {
        setStatus('disconnected');
      },
    });
    providerRef.current = hp;

    // Set user presence in awareness
    hp.awareness?.setLocalStateField('user', {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      avatarUrl: currentUser.avatarUrl,
    });

    // Track other users via awareness 'change' event
    // Use provider's internal clientID to filter self (more reliable than user ID)
    const myClientId = hp.document.clientID;

    const handleAwarenessChange = () => {
      if (!hp.awareness) return;
      const states = hp.awareness.getStates();
      const users: CollabUser[] = [];
      states.forEach((state, clientId) => {
        if (clientId !== myClientId && state?.user) {
          users.push(state.user as CollabUser);
        }
      });

      // Prevent unnecessary React re-renders when only cursor positions change.
      // We only care if the actual list of connected users changed.
      setConnectedUsers((prevUsers) => {
        if (prevUsers.length !== users.length) return users;
        const prevIds = prevUsers.map((u) => u.id).sort().join(',');
        const newIds = users.map((u) => u.id).sort().join(',');
        if (prevIds !== newIds) return users;
        // Also check if someone updated their profile (e.g. name or avatar)
        const isProfileChanged = prevUsers.some(prev => {
          const newest = users.find(u => u.id === prev.id);
          return newest && (newest.name !== prev.name || newest.avatarUrl !== prev.avatarUrl);
        });
        if (isProfileChanged) return users;
        return prevUsers;
      });
    };

    hp.awareness?.on('change', handleAwarenessChange);
    handleAwarenessChange(); // Sync immediately in case peers are already connected

    // Expose provider.document (the Y.Doc the provider owns) to consumers
    setYdoc(hp.document as Y.Doc);
    setProvider(hp);

    return () => {
      hp.awareness?.off('change', handleAwarenessChange);
      hp.destroy();
      providerRef.current = null;
      setYdoc(null);
      setProvider(null);
      setConnectedUsers([]);
      setStatus('disconnected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, ydocKey]);

  return { ydoc, provider, connectedUsers, status };
}
