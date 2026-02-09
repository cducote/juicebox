import type { ActivityLog } from "@juicebox/db";

const ACTION_LABELS: Record<string, string> = {
  PROJECT_CREATED: "Created project",
  PROJECT_UPDATED: "Updated project",
  STATUS_CHANGED: "Changed status",
  PAYMENT_RECEIVED: "Payment received",
  PAYMENT_FAILED: "Payment failed",
  TASK_CREATED: "Created task",
  TASK_UPDATED: "Updated task",
  HANDOFF_STARTED: "Started handoff",
  HANDOFF_COMPLETED: "Completed handoff",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-text-muted">No activity yet</p>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-juice-400" />
          <div className="flex-1">
            <p className="text-sm">
              {ACTION_LABELS[log.action] ?? log.action}
            </p>
            <p className="text-xs text-text-muted">
              {formatRelativeTime(log.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
