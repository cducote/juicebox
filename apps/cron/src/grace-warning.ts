import { db } from "@juicebox/db";
import { sendEmail } from "@juicebox/email";

/**
 * Daily cron: warns clients whose PAUSED projects are within 30 days
 * of their grace period expiring.
 */
async function main() {
  console.log("[grace-warning] Starting...");

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const pausedProjects = await db.project.findMany({
    where: {
      status: "PAUSED",
      gracePeriodStartedAt: { not: null },
    },
    include: { client: true },
  });

  let warningCount = 0;

  for (const project of pausedProjects) {
    if (!project.gracePeriodStartedAt || !project.client) continue;

    const graceEnd = new Date(project.gracePeriodStartedAt);
    graceEnd.setMonth(graceEnd.getMonth() + project.gracePeriodMonths);

    // Warn if grace period ends within 30 days but hasn't ended yet
    if (graceEnd > now && graceEnd <= thirtyDaysFromNow) {
      const daysRemaining = Math.ceil(
        (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      await db.notification.create({
        data: {
          type: "GRACE_PERIOD_WARNING",
          title: "Grace Period Ending Soon",
          message: `Your project "${project.title}" grace period expires in ${daysRemaining} days.`,
          userId: project.client.id,
          projectId: project.id,
        },
      });

      await sendEmail("grace-warning", {
        to: project.client.email,
        projectTitle: project.title,
        daysRemaining,
      });

      warningCount++;
      console.log(`[grace-warning] Warned: ${project.title} (${daysRemaining} days remaining)`);
    }
  }

  console.log(`[grace-warning] Done. Sent ${warningCount} warnings.`);
}

main()
  .catch((err) => {
    console.error("[grace-warning] Fatal error:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
