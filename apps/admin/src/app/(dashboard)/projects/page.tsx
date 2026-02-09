import Link from "next/link";
import { db } from "@juicebox/db";
import { Button } from "@juicebox/ui/components/button";
import { ProjectCard } from "@/components/project-card";
import { Plus } from "lucide-react";

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];

  try {
    projects = await fetchProjects();
  } catch {
    // DB not connected yet
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-text-secondary">No projects yet</p>
          <Link href="/projects/new" className="mt-2">
            <Button variant="outline" size="sm">
              Create your first project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              slug={project.slug}
              title={project.title}
              status={project.status}
              client={project.client}
              amountPaid={project.amountPaid}
              totalAmount={project.totalAmount}
              taskCount={project._count.tasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchProjects() {
  return db.project.findMany({
    include: {
      client: { select: { name: true, email: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
