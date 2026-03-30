'use client';

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { useRouter } from 'next/navigation';

const TYPE_ICONS: Record<Notification['type'], string> = {
  system: '🔔',
  content: '💎',
  drop: '⚡',
  achievement: '🏆',
  subscription: '💳',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      const data = res.data;
      // Handle both { notifications: [...] } and direct array
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data?.notifications) {
        setNotifications(data.notifications);
      } else if (data?.data) {
        setNotifications(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // Silently fail; notifications are non-critical
    }
  }, []);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayed = notifications.slice(0, 10);

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleClickNotification(notif: Notification) {
    if (!notif.isRead) {
      try {
        await notificationsApi.markRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch {
        // ignore
      }
    }
    setOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const bellBtnStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid #00ff4133',
    background: open ? 'rgba(0,255,65,0.08)' : 'rgba(0,255,65,0.04)',
    cursor: 'pointer',
    outline: 'none',
    padding: 0,
    transition: 'all 0.2s ease',
    boxShadow: open ? '0 0 12px #00ff4144' : 'none',
  };

  const badgeStyle: CSSProperties = {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    background: '#ff4400',
    border: '2px solid #050a05',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1,
    padding: '0 3px',
    boxShadow: '0 0 6px #ff440099',
  };

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 340,
    maxHeight: 480,
    background: '#050a05',
    border: '1px solid #00ff4133',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px #00ff4111',
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const dropHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #00ff4122',
    background: 'rgba(0,255,65,0.03)',
    flexShrink: 0,
  };

  const dropTitleStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#00ff41',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const markAllBtnStyle: CSSProperties = {
    fontSize: 10,
    color: '#00d4ff',
    background: 'none',
    border: 'none',
    cursor: loading ? 'wait' : 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    padding: '2px 6px',
    borderRadius: 4,
    opacity: loading ? 0.5 : 1,
    transition: 'color 0.15s',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
  };

  const listStyle: CSSProperties = {
    overflowY: 'auto',
    flex: 1,
  };

  const emptyStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    color: '#00ff4144',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    gap: 8,
  };

  return (
    <>
      <style>{`
        .notif-item:hover { background: rgba(0,255,65,0.06) !important; }
        .notif-list::-webkit-scrollbar { width: 4px; }
        .notif-list::-webkit-scrollbar-track { background: #050a05; }
        .notif-list::-webkit-scrollbar-thumb { background: #00ff4133; border-radius: 2px; }
        .notif-markall:hover { color: #00ff41 !important; }
      `}</style>
      <div style={wrapperStyle} ref={containerRef}>
        <button
          style={bellBtnStyle}
          onClick={() => setOpen((v) => !v)}
          aria-label="Notificações"
          type="button"
        >
          <Bell size={16} color={open ? '#00ff41' : '#00ff4199'} strokeWidth={2} />
          {unreadCount > 0 && (
            <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div style={dropdownStyle}>
            {/* Header */}
            <div style={dropHeaderStyle}>
              <span style={dropTitleStyle}>{'// Notificações'}</span>
              <button
                className="notif-markall"
                style={markAllBtnStyle}
                onClick={handleMarkAllRead}
                disabled={loading || unreadCount === 0}
                type="button"
              >
                Marcar todas como lidas
              </button>
            </div>

            {/* List */}
            <div style={listStyle} className="notif-list">
              {displayed.length === 0 ? (
                <div style={emptyStyle}>
                  <Bell size={28} color="#00ff4133" />
                  <span>Nenhuma notificação</span>
                </div>
              ) : (
                displayed.map((notif) => (
                  <NotificationItem
                    key={notif._id}
                    notif={notif}
                    onClick={() => handleClickNotification(notif)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({
  notif,
  onClick,
}: {
  notif: Notification;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid #00ff4111',
    cursor: notif.link ? 'pointer' : 'default',
    transition: 'background 0.15s ease',
    background: hovered
      ? 'rgba(0,255,65,0.06)'
      : notif.isRead
      ? 'transparent'
      : 'rgba(0,255,65,0.03)',
    position: 'relative',
  };

  const unreadBarStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    background: '#00ff41',
    borderRadius: '0 2px 2px 0',
    boxShadow: '0 0 6px #00ff41',
  };

  const iconStyle: CSSProperties = {
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
    marginTop: 1,
    filter: notif.isRead ? 'grayscale(0.5) opacity(0.6)' : 'none',
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: notif.isRead ? 400 : 700,
    color: notif.isRead ? '#00ff4199' : '#00ff41',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.4,
    marginBottom: 2,
    wordBreak: 'break-word',
  };

  const msgStyle: CSSProperties = {
    fontSize: 10,
    color: notif.isRead ? '#ffffff44' : '#ffffff88',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.5,
    wordBreak: 'break-word',
  };

  const timeStyle: CSSProperties = {
    fontSize: 9,
    color: '#00d4ff55',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 4,
    display: 'block',
  };

  return (
    <div
      style={itemStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role={notif.link ? 'button' : undefined}
      tabIndex={notif.link ? 0 : undefined}
      onKeyDown={(e) => {
        if (notif.link && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
    >
      {!notif.isRead && <span style={unreadBarStyle} />}
      <span style={iconStyle}>{TYPE_ICONS[notif.type]}</span>
      <div style={bodyStyle}>
        <div style={titleStyle}>{notif.title}</div>
        <div style={msgStyle}>{notif.message}</div>
        <span style={timeStyle}>{timeAgo(notif.createdAt)}</span>
      </div>
    </div>
  );
}

export default NotificationBell;
