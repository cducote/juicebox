import { notFound } from "next/navigation";
import { db } from "@juicebox/db";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { StatusBadge } from "@/components/status-badge";
import { ProjectOverrides } from "./project-overrides";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectSettingsPage({ params }: Props) {
  const { slug } = await params;

  const project = await db.project.findUnique({
    where: { slug },
    include: { client: { select: { name: true, email: true } } },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings & Overrides</h1>
        <StatusBadge status={project.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Title</span>
            <span className="font-medium">{project.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Client</span>
            <span className="font-medium">
              {project.client?.name ?? project.client?.email ?? "None"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Deal Type</span>
            <span className="font-medium">{project.dealType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Total Amount</span>
            <span className="font-medium">
              ${(project.totalAmount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Amount Paid</span>
            <span className="font-medium">
              ${(project.amountPaid / 100).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      <ProjectOverrides
        projectId={project.id}
        currentStatus={project.status}
        gracePeriodMonths={project.gracePeriodMonths}
        missedPayments={project.missedPayments}
        stripeSubscriptionId={project.stripeSubscriptionId}
      />
    </div>
  );
}
