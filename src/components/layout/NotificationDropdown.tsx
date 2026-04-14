'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Package, Star, AlertTriangle, DollarSign, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

const NOTIF_ICONS: Record<NotificationType, React.FC<{ className?: string }>> = {
  order_update: Package,
  new_sale: DollarSign,
  low_stock: AlertTriangle,
  payout: DollarSign,
  review: Star,
  system: Settings,
};

const NOTIF_COLORS: Record<NotificationType, string> = {
  order_update: 'text-blue-400 bg-blue-400/10',
  new_sale: 'text-green-400 bg-green-400/10',
  low_stock: 'text-yellow-400 bg-yellow-400/10',
  payout: 'text-gold bg-gold/10',
  review: 'text-purple-400 bg-purple-400/10',
  system: 'text-ivory-muted bg-obsidian-light',
};

function NotificationItem({ notification, onRead }: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const Icon = NOTIF_ICONS[notification.type] ?? Bell;
  const colorClass = NOTIF_COLORS[notification.type] ?? NOTIF_COLORS.system;

  return (
    <button
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-obsidian-light/50 transition-colors',
        !notification.is_read && 'bg-gold/5'
      )}
    >
      <div className={cn('p-2 rounded-lg flex-shrink-0 mt-0.5', colorClass)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ivory leading-snug">{notification.title}</p>
        <p className="text-xs text-ivory-muted mt-0.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-ivory-subtle mt-1">
          {formatRelativeDate(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 bg-obsidian-mid border border-obsidian-border rounded-xl shadow-card overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-ivory">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge-gold text-[10px] px-1.5 py-0">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-1 text-xs text-ivory-muted hover:text-gold transition-colors"
          >
            <Check className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-obsidian-border/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Bell className="w-8 h-8 text-ivory-subtle" />
            <p className="text-sm text-ivory-muted">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onRead={markAsRead}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
