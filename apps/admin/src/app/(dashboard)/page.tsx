import Link from "next/link";
import { db } from "@juicebox/db";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { Badge } from "@juicebox/ui/components/badge";
import { StatusBadge } from "@/components/status-badge";
import { ActivityFeed } from "@/components/activity-feed";
import { formatCents } from "@/components/payment-progress";

async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    suspendedProjects,
    revenueThisMonth,
    recurringExpenses,
    monthExpenses,
    recentActivity,
    needsAttention,
  ] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { status: "ACTIVE" } }),
    db.project.count({ where: { status: "COMPLETED" } }),
    db.project.count({ where: { status: "SUSPENDED" } }),
    db.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.expense.findMany({ where: { isRecurring: true } }),
    db.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { project: { select: { title: true, slug: true } } },
    }),
    db.project.findMany({
      where: { status: { in: ["SUSPENDED", "PAUSED", "COMPLETED"] } },
      include: {
        client: { select: { name: true, email: true } },
        _count: { select: { handoffItems: { where: { completed: false } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const monthlyBurn = recurringExpenses.reduce((sum, exp) => {
    if (exp.recurringInterval === "MONTHLY") return sum + exp.amount;
    if (exp.recurringInterval === "YEARLY") return sum + Math.round(exp.amount / 12);
    return sum;
  }, 0);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    suspendedProjects,
    revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
    expensesThisMonth: monthExpenses._sum.amount ?? 0,
    monthlyBurn,
    recentActivity,
    needsAttention,
  };
}

export default async function DashboardPage() {
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;

  try {
    stats = await getDashboardStats();
  } catch {
    // DB not connected
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="py-8 text-center text-text-muted">
            Database not connected. Set up your .env.local and run db:push.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Projects" value={String(stats.totalProjects)} />
        <StatCard title="Active" value={String(stats.activeProjects)} highlight />
        <StatCard title="Completed" value={String(stats.completedProjects)} />
        <StatCard
          title="Revenue This Month"
          value={formatCents(stats.revenueThisMonth)}
          highlight
        />
        <StatCard
          title="Expenses This Month"
          value={formatCents(stats.expensesThisMonth)}
          subtitle={`${formatCents(stats.monthlyBurn)}/mo burn`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-text-muted">No activity yet</p>
            ) : (
              <ActivityFeed logs={stats.recentActivity} />
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.needsAttention.length === 0 ? (
              <p className="text-sm text-text-muted">All clear — nothing needs attention</p>
            ) : (
              <div className="space-y-3">
                {stats.needsAttention.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-surface-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{project.title}</p>
                      <p className="text-xs text-text-muted">
                        {project.client?.name ?? project.client?.email ?? "No client"}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suspended Projects Warning */}
      {stats.suspendedProjects > 0 && (
        <Card className="border-status-error/30 bg-status-error/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Badge variant="destructive">{stats.suspendedProjects}</Badge>
            <span className="text-sm">
              project{stats.suspendedProjects > 1 ? "s" : ""} currently suspended.{" "}
              <Link href="/projects?status=SUSPENDED" className="font-medium text-juice-600 hover:underline">
                View suspended projects
              </Link>
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  highlight,
}: {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? "text-juice-600" : ""}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
