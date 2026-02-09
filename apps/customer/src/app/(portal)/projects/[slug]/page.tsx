import { notFound } from "next/navigation";
import { db } from "@juicebox/db";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { ProjectStatusDisplay } from "@/components/project-status-display";

export default async function CustomerProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let project: Awaited<ReturnType<typeof fetchProject>> = null;

  try {
    const { userId } = await auth();
    if (!userId) notFound();

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) notFound();

    project = await fetchProject(slug, dbUser.id);
  } catch {
    notFound();
  }

  if (!project) notFound();

  const paidPercent =
    project.totalAmount > 0
      ? Math.round((project.amountPaid / project.totalAmount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{project.title}</h1>

      <ProjectStatusDisplay status={project.status} />

      {/* Payment Progress */}
      {project.totalAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-3 w-full rounded-full bg-surface-tertiary">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                ${(project.amountPaid / 100).toFixed(2)} of $
                {(project.totalAmount / 100).toFixed(2)}
              </span>
              <span className="font-medium">{paidPercent}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {project.tasks.length === 0 ? (
            <p className="text-sm text-text-muted">No milestones yet</p>
          ) : (
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      task.status === "DONE" ? "bg-emerald-500" : "bg-surface-tertiary"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      task.status === "DONE" ? "text-text-muted line-through" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
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
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    ${(payment.amount / 100).toFixed(2)}
                  </span>
                  <span className="text-text-muted">
                    {payment.paidAt?.toLocaleDateString() ?? "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {project.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-juice-600 hover:underline"
                >
                  {doc.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function fetchProject(slug: string, clientId: string) {
  return db.project.findFirst({
    where: { slug, clientId },
    include: {
      // Only milestone tasks are visible to customers
      tasks: {
        where: { isMilestone: true },
        orderBy: { sortOrder: "asc" },
      },
      payments: {
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
