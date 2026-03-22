'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  notificationService,
  Notification,
} from '@/services/notification-service';
import { useAuth } from '@/lib/auth-context';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 加载未读数量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent fail
    }
  }, []);

  // 加载通知列表
  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({
        page,
        limit: 20,
      });
      if (page === 1) {
        setNotifications(res.data);
      } else {
        setNotifications((prev) => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === 20 && res.total > page * 20);
      pageRef.current = page;
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(pageRef.current + 1);
    }
  }, [loading, hasMore, fetchNotifications]);

  // 标记单条已读
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent fail
    }
  }, []);

  // 标记全部已读
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  }, []);

  // 删除通知
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch {
      // silent fail
    }
  }, []);

  // 清除已读
  const clearRead = useCallback(async () => {
    try {
      await notificationService.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch {
      // silent fail
    }
  }, []);

  // 建立 SSE 连接
  useEffect(() => {
    if (!user) return;

    // 初始加载
    fetchUnreadCount();
    fetchNotifications(1);

    // SSE 连接
    const es = notificationService.createSSEConnection();
    if (!es) return;

    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // 忽略连接确认消息
        if (data.type === 'connected') return;

        // 新通知推入列表顶部
        setNotifications((prev) => [data as Notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // 显示 toast 提示
        toast(data.title, {
          description: data.content || undefined,
          duration: 5000,
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource 会自动重连
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user, fetchUnreadCount, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  };
}
