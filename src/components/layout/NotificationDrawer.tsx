'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CloseIcon,
  CalendarIcon,
  MegaphoneIcon,
  CampaignIcon,
  ClockIcon,
  PoundIcon,
  InfoIcon,
  BellIcon,
  ChevronRightIcon,
} from '@/components/ui/Icons';
import { getNotifications } from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/notifications';
import { withRequestRef } from '@/lib/api/errors';

// ============================================
// Icon + style helpers
// ============================================

function getNotificationIcon(type: string) {
  if (type.startsWith('event')) return <CalendarIcon size={15} />;
  if (type.startsWith('announcement')) return <MegaphoneIcon size={15} />;
  if (type === 'campaign_payment') return <PoundIcon size={15} />;
  if (type.startsWith('campaign')) return <CampaignIcon size={15} />;
  if (type === 'prayer_update') return <ClockIcon size={15} />;
  return <InfoIcon size={15} />;
}

function getIconStyle(type: string): string {
  if (type.startsWith('event')) return 'text-[var(--brand)] bg-[var(--brand-10)]';
  if (type.startsWith('announcement')) return 'text-[var(--auxiliary-700)] bg-[rgba(254,99,47,0.1)]';
  if (type === 'campaign_payment') return 'text-[var(--success-600)] bg-[rgba(71,184,129,0.1)]';
  if (type.startsWith('campaign')) return 'text-[var(--brand)] bg-[var(--brand-10)]';
  if (type === 'prayer_update') return 'text-[#6366f1] bg-[rgba(99,102,241,0.1)]';
  return 'text-[var(--grey-100)] bg-[var(--neutral-100)]';
}

function getTypeLabel(type: string): string {
  if (type.startsWith('event')) return 'Events';
  if (type.startsWith('announcement')) return 'Announcements';
  if (type === 'campaign_payment') return 'Payments';
  if (type.startsWith('campaign')) return 'Campaigns';
  if (type === 'prayer_update') return 'Prayer Times';
  if (type === 'system_update') return 'System';
  return 'General';
}

// ============================================
// Timestamp formatting
// ============================================

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// ============================================
// Skeleton loader
// ============================================

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-5 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-[10px] bg-[var(--neutral-300)] shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3 bg-[var(--neutral-300)] rounded-full w-3/4" />
        <div className="h-2.5 bg-[var(--neutral-300)] rounded-full w-2/5" />
        <div className="h-2.5 bg-[var(--neutral-300)] rounded-full w-full" />
      </div>
    </div>
  );
}

// ============================================
// Single notification item
// ============================================

function NotificationItem({ notification }: { notification: Notification }) {
  const { type, title, message, is_read, created_at } = notification;

  return (
    <div
      className={`group relative flex items-start gap-3 px-5 py-[14px] cursor-pointer transition-colors duration-150 hover:bg-[#f8fafb] border-b border-[var(--border-01)] last:border-0 ${
        !is_read ? 'bg-[rgba(7,119,52,0.025)]' : 'bg-white'
      }`}
    >
      {/* Unread accent bar */}
      {!is_read && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[50%] bg-[var(--brand)] rounded-r-full" />
      )}

      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${getIconStyle(type)}`}
      >
        {getNotificationIcon(type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`font-inter text-[13px] leading-snug ${
              !is_read
                ? 'font-semibold text-[var(--grey-800)]'
                : 'font-medium text-[var(--grey-800)]'
            }`}
          >
            {title}
          </p>
          <ChevronRightIcon
            size={14}
            className="text-[var(--neutral-500)] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          />
        </div>

        {/* Timestamp + category */}
        <div className="flex items-center gap-1.5 mt-[3px]">
          <span className="font-inter text-[11px] text-[var(--neutral-500)]">
            {formatTimestamp(created_at)}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-[var(--neutral-500)] shrink-0" />
          <span className="font-inter text-[11px] text-[var(--neutral-500)]">
            {getTypeLabel(type)}
          </span>
        </div>

        {/* Message preview */}
        {message && (
          <p className="font-inter text-[12px] text-[var(--grey-100)] mt-1.5 line-clamp-1 leading-snug">
            {message}
          </p>
        )}
      </div>

      {/* Unread dot */}
      {!is_read && (
        <span className="w-[7px] h-[7px] rounded-full bg-[var(--brand)] shrink-0 mt-[5px]" />
      )}
    </div>
  );
}

// ============================================
// Group section
// ============================================

function GroupSection({ label, items }: { label: string; items: Notification[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="px-5 py-2.5 sticky top-0 z-10 bg-[#f8fafb] border-b border-[var(--border-01)]">
        <span className="font-inter font-semibold text-[10px] text-[var(--neutral-500)] uppercase tracking-[0.8px]">
          {label}
        </span>
      </div>
      {items.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}

// ============================================
// Main Drawer component
// ============================================

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad?: (notifications: Notification[]) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  onLoad,
}: NotificationDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRead, setAllRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAllRead(false);
    try {
      const data = await getNotifications();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sorted);
      onLoad?.(sorted);
    } catch (err) {
      setError(withRequestRef('Failed to load notifications.', err));
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  // Mount/unmount with slide animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      fetchNotifications();
      return () => cancelAnimationFrame(raf1);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchNotifications]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const displayedNotifications = allRead
    ? notifications.map((n) => ({ ...n, is_read: true }))
    : notifications;

  const todayItems = displayedNotifications.filter((n) => isToday(n.created_at));
  const earlierItems = displayedNotifications.filter((n) => !isToday(n.created_at));
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const hasUnread = unreadCount > 0;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`relative w-[400px] max-sm:w-full h-full bg-[#f8fafb] flex flex-col transition-transform duration-300 ease-in-out shadow-[-8px_0_40px_rgba(0,0,0,0.08)] ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 bg-white border-b border-[var(--border-01)] shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-inter font-bold text-[18px] text-[var(--grey-800)] tracking-[-0.2px]">
              Notifications
            </h2>
            <div className="flex items-center gap-2">
              {!loading && hasUnread && !allRead && (
                <button
                  onClick={() => setAllRead(true)}
                  className="font-inter text-[12px] font-medium text-[var(--neutral-500)] hover:text-[var(--brand)] transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={onClose}
                className="w-[36px] h-[36px] flex items-center justify-center bg-[rgba(7,119,52,0.1)] rounded-[8px] hover:bg-[rgba(7,119,52,0.2)] transition-colors shrink-0"
                aria-label="Close notifications"
              >
                <CloseIcon size={24} className="text-[var(--grey-800)]" />
              </button>
            </div>
          </div>

        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto bg-white mt-3 rounded-t-[16px] scrollbar-hide">
          {/* Skeleton */}
          {loading && (
            <div className="divide-y divide-[var(--border-01)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonItem key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-20 text-center">
              <p className="font-inter text-[14px] text-[var(--neutral-500)]">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-3 font-inter text-[13px] font-medium text-[var(--brand)] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-20 text-center">
              <div className="w-12 h-12 rounded-[14px] bg-[var(--neutral-100)] flex items-center justify-center mb-4">
                <BellIcon size={22} className="text-[var(--neutral-500)]" />
              </div>
              <p className="font-inter font-semibold text-[15px] text-[var(--grey-800)]">
                All caught up!
              </p>
              <p className="font-inter text-[13px] text-[var(--neutral-500)] mt-1">
                No notifications yet
              </p>
            </div>
          )}

          {/* List */}
          {!loading && !error && notifications.length > 0 && (
            <>
              <GroupSection label="Today" items={todayItems} />
              <GroupSection label="Earlier" items={earlierItems} />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
