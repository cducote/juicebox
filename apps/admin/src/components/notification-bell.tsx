"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useEventSource } from "@/hooks/use-event-source";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  projectId: string | null;
};

/**
 * Bell icon in the admin top bar — shows unread count badge,
 * dropdown with recent notifications, click to navigate.
 * Wired to SSE for instant unread count updates.
 */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // SSE connection — refreshes data on any notification event
  useEventSource((event) => {
    if (event.type === "notification") {
      fetchNotifications();
    }
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently fail — bell just won't update
    }
  }

  async function markAsRead(ids: string[]) {
    startTransition(async () => {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        await fetchNotifications();
      } catch {
        // Ignore
      }
    });
  }

  async function markAllRead() {
    startTransition(async () => {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read-all" }),
        });
        await fetchNotifications();
      } catch {
        // Ignore
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-text-secondary hover:bg-surface-secondary hover:text-text"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={isPending}
                  className="text-xs text-juice-600 hover:text-juice-700 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-text-muted">
                No notifications yet
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-surface-secondary ${
                      !n.read ? "bg-juice-50/30" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markAsRead([n.id]);
                      setOpen(false);
                    }}
                  >
                    {!n.read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-juice-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="truncate text-xs text-text-secondary">
                        {n.message}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Link
              href="/notifications"
              className="block border-t border-border px-4 py-2 text-center text-xs text-juice-600 hover:bg-surface-secondary"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
