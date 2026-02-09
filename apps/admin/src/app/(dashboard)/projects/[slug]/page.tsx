import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { StatusBadge } from "@/components/status-badge";
import { PaymentProgress, formatCents } from "@/components/payment-progress";
import { ActivityFeed } from "@/components/activity-feed";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let project: Awaited<ReturnType<typeof getProject>>;

  try {
    project = await getProject(slug);
  } catch {
    notFound();
  }

  if (!project) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.client && (
            <p className="text-text-secondary">
              {project.client.name || project.client.email}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Sub-page navigation */}
      <div className="flex gap-3 text-sm">
        <Link
          href={`/projects/${project.slug}/handoff`}
          className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-secondary"
        >
          Handoff Checklist
        </Link>
        <Link
          href={`/projects/${project.slug}/settings`}
          className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-secondary"
        >
          Settings & Overrides
        </Link>
      </div>

      {/* Status Pipeline Visual */}
      <StatusPipeline currentStatus={project.status} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {project.totalAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PaymentProgress
                  amountPaid={project.amountPaid}
                  totalAmount={project.totalAmount}
                />
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-text-muted">Monthly</p>
                    <p className="font-semibold">{formatCents(project.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Term</p>
                    <p className="font-semibold">{project.termMonths} months</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Remaining</p>
                    <p className="font-semibold">
                      {formatCents(project.totalAmount - project.amountPaid)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks & Epics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">
                {project.tasks.length} tasks across {project.epics.length} epics
              </p>
            </CardContent>
          </Card>

          {/* Payment History */}
          {project.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{formatCents(payment.amount)}</span>
                      <span className="text-text-muted">
                        {payment.paidAt?.toLocaleDateString() ?? "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Deal Type</span>
                <span className="font-medium">{project.dealType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Grace Period</span>
                <span className="font-medium">{project.gracePeriodMonths} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Missed Payments</span>
                <span className="font-medium">{project.missedPayments}</span>
              </div>
            </CardContent>
          </Card>

          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">{project.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed logs={project.activityLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const PIPELINE_STATUSES = [
  "PLANNING",
  "AGREEMENT_PENDING",
  "PAYMENT_SETUP",
  "ACTIVE",
  "COMPLETED",
  "HANDED_OFF",
] as const;

const PIPELINE_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  AGREEMENT_PENDING: "Agreement",
  PAYMENT_SETUP: "Payment",
  ACTIVE: "Active",
  COMPLETED: "Complete",
  HANDED_OFF: "Handed Off",
};

function StatusPipeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = PIPELINE_STATUSES.indexOf(
    currentStatus as (typeof PIPELINE_STATUSES)[number],
  );

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STATUSES.map((status, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={status} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${
                isPast || isCurrent
                  ? "bg-juice-500"
                  : "bg-surface-tertiary"
              }`}
            />
            <span
              className={`text-xs ${
                isCurrent ? "font-semibold text-juice-600" : "text-text-muted"
              }`}
            >
              {PIPELINE_LABELS[status]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
