import { db } from "@juicebox/db";
import { sendEmail } from "@juicebox/email";

/**
 * Daily cron: finds PAUSED projects whose grace period has expired.
 * Transitions them to SUSPENDED and notifies all parties.
 */
async function main() {
  console.log("[grace-monitor] Starting...");

  const now = new Date();

  const pausedProjects = await db.project.findMany({
    where: {
      status: "PAUSED",
      gracePeriodStartedAt: { not: null },
    },
    include: { client: true },
  });

  let suspendedCount = 0;

  for (const project of pausedProjects) {
    if (!project.gracePeriodStartedAt) continue;

    const graceEnd = new Date(project.gracePeriodStartedAt);
    graceEnd.setMonth(graceEnd.getMonth() + project.gracePeriodMonths);

    if (now >= graceEnd) {
      await db.project.update({
        where: { id: project.id },
        data: { status: "SUSPENDED" },
      });

      await db.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          actor: "system",
          projectId: project.id,
          metadata: { newStatus: "SUSPENDED", reason: "grace_period_expired" },
        },
      });

      // Notify client
      if (project.client) {
        await db.notification.create({
          data: {
            type: "STATUS_CHANGE",
            title: "Project Suspended",
            message: `Your project "${project.title}" has been suspended due to the grace period expiring.`,
            userId: project.client.id,
            projectId: project.id,
          },
        });

        await sendEmail("project-suspended", {
          to: project.client.email,
          projectTitle: project.title,
        });
      }

      suspendedCount++;
      console.log(`[grace-monitor] Suspended: ${project.title}`);
    }
  }

  console.log(`[grace-monitor] Done. Suspended ${suspendedCount} projects.`);
}

main()
  .catch((err) => {
    console.error("[grace-monitor] Fatal error:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
