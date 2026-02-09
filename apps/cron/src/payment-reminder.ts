import { db } from "@juicebox/db";
import { sendEmail } from "@juicebox/email";

/**
 * Weekly cron: reminds clients with active subscriptions that a payment
 * is coming up soon.
 */
async function main() {
  console.log("[payment-reminder] Starting...");

  const activeProjects = await db.project.findMany({
    where: {
      status: "ACTIVE",
      stripeSubscriptionId: { not: null },
      dealType: "INSTALLMENT",
    },
    include: { client: true },
  });

  let reminderCount = 0;

  for (const project of activeProjects) {
    if (!project.client) continue;

    await sendEmail("payment-reminder", {
      to: project.client.email,
      projectTitle: project.title,
      amount: project.monthlyPayment,
    });

    reminderCount++;
    console.log(`[payment-reminder] Reminded: ${project.client.email} for ${project.title}`);
  }

  console.log(`[payment-reminder] Done. Sent ${reminderCount} reminders.`);
}

main()
  .catch((err) => {
    console.error("[payment-reminder] Fatal error:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
