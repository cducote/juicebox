import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";
import { Card, CardContent } from "@juicebox/ui/components/card";
import { Badge } from "@juicebox/ui/components/badge";
import { MarkAllReadButton } from "./mark-all-read-button";

const TYPE_LABELS: Record<string, string> = {
  PAYMENT_RECEIVED: "Payment",
  PAYMENT_MISSED: "Payment Issue",
  GRACE_PERIOD_WARNING: "Grace Period",
  STATUS_CHANGE: "Status",
  HANDOFF_READY: "Handoff",
  GENERAL: "General",
};

const TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAYMENT_RECEIVED: "default",
  PAYMENT_MISSED: "destructive",
  GRACE_PERIOD_WARNING: "outline",
  STATUS_CHANGE: "secondary",
  HANDOFF_READY: "default",
  GENERAL: "outline",
};

export default async function NotificationsPage() {
  let notifications: Awaited<ReturnType<typeof fetchNotifications>> = [];
  let unreadCount = 0;

  try {
    const admin = await requireAdmin();
    [notifications, unreadCount] = await Promise.all([
      fetchNotifications(admin.id),
      db.notification.count({ where: { userId: admin.id, read: false } }),
    ]);
  } catch {
    // DB not connected or not authenticated
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-text-muted">
            No notifications yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardContent className="flex items-start gap-3 py-3">
                {!n.read && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-juice-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Badge variant={TYPE_VARIANTS[n.type] ?? "outline"}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {n.createdAt.toLocaleDateString()} at{" "}
                    {n.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
