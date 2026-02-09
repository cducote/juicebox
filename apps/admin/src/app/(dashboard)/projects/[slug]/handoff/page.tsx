import { notFound } from "next/navigation";
import { db } from "@juicebox/db";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { Badge } from "@juicebox/ui/components/badge";
import { HandoffChecklist } from "./handoff-checklist";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HandoffPage({ params }: Props) {
  const { slug } = await params;

  const project = await db.project.findUnique({
    where: { slug },
    include: { handoffItems: { orderBy: { sortOrder: "asc" } } },
  });

  if (!project) notFound();

  // Only visible for COMPLETED or HANDED_OFF projects
  if (project.status !== "COMPLETED" && project.status !== "HANDED_OFF") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Handoff</h1>
        <Card>
          <CardContent className="py-8 text-center text-text-muted">
            Handoff is only available for completed projects. This project is currently{" "}
            <Badge variant="secondary">{project.status}</Badge>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = project.handoffItems.filter((i) => i.completed).length;
  const totalCount = project.handoffItems.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Handoff Checklist</h1>
        {project.status === "HANDED_OFF" && (
          <Badge variant="default" className="bg-status-success">
            Handed Off
          </Badge>
        )}
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              {completedCount} of {totalCount} items complete
            </span>
            <span className="text-text-secondary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className={`h-full rounded-full transition-all ${
                allComplete ? "bg-status-success" : "bg-juice-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {totalCount === 0 ? (
            <p className="text-sm text-text-muted">
              No checklist items yet. Generate the default checklist to get started.
            </p>
          ) : (
            <HandoffChecklist
              items={project.handoffItems.map((i) => ({
                id: i.id,
                label: i.label,
                completed: i.completed,
                completedAt: i.completedAt?.toISOString() ?? null,
              }))}
              projectId={project.id}
              isFinalized={project.status === "HANDED_OFF"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
