import { db } from "@juicebox/db";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { Badge } from "@juicebox/ui/components/badge";
import { PROJECT_STATUS_CONFIG } from "@juicebox/api/constants";
import type { ProjectStatus } from "@juicebox/db";

export default async function CustomerPortalPage() {
  let projects: Array<{
    slug: string;
    title: string;
    status: ProjectStatus;
    amountPaid: number;
    totalAmount: number;
    monthlyPayment: number;
  }> = [];

  try {
    const { userId } = await auth();
    if (userId) {
      const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
      if (dbUser) {
        projects = await db.project.findMany({
          where: { clientId: dbUser.id },
          select: {
            slug: true,
            title: true,
            status: true,
            amountPaid: true,
            totalAmount: true,
            monthlyPayment: true,
          },
          orderBy: { updatedAt: "desc" },
        });
      }
    }
  } catch {
    // DB not connected or user not found
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Projects</h1>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary">
              No projects yet. Your projects will appear here once they're set up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const statusConfig = PROJECT_STATUS_CONFIG[project.status];
            const paidPercent =
              project.totalAmount > 0
                ? Math.round((project.amountPaid / project.totalAmount) * 100)
                : 0;

            return (
              <Link key={project.slug} href={`/projects/${project.slug}`}>
                <Card className="transition-shadow hover:shadow-card-hover">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-base">{project.title}</CardTitle>
                    <Badge variant="secondary">{statusConfig.label}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.totalAmount > 0 && (
                      <>
                        <div className="h-2 w-full rounded-full bg-surface-tertiary">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>
                        <p className="text-sm text-text-secondary">
                          {paidPercent}% paid &middot; $
                          {(project.monthlyPayment / 100).toFixed(2)}/month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
