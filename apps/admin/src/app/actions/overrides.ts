"use server";

import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";
import { revalidatePath } from "next/cache";

/** Extend or shorten a project's grace period */
export async function overrideGracePeriod(projectId: string, months: number) {
  const admin = await requireAdmin();

  const project = await db.project.update({
    where: { id: projectId },
    data: { gracePeriodMonths: months },
  });

  await db.activityLog.create({
    data: {
      action: "GRACE_PERIOD_OVERRIDE",
      actor: admin.clerkId,
      projectId,
      metadata: { newGracePeriodMonths: months },
    },
  });

  revalidatePath(`/projects/${project.slug}`);
}

/** Reset missed payment counter to zero */
export async function resetMissedPayments(projectId: string) {
  const admin = await requireAdmin();

  const project = await db.project.update({
    where: { id: projectId },
    data: { missedPayments: 0 },
  });

  await db.activityLog.create({
    data: {
      action: "MISSED_PAYMENTS_RESET",
      actor: admin.clerkId,
      projectId,
    },
  });

  revalidatePath(`/projects/${project.slug}`);
}

/** Record a manual payment (for equity deals or payments outside Stripe) */
export async function recordManualPayment(projectId: string, amountCents: number) {
  const admin = await requireAdmin();

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  await db.payment.create({
    data: {
      amount: amountCents,
      status: "PAID",
      paidAt: new Date(),
      projectId,
    },
  });

  const newAmountPaid = project.amountPaid + amountCents;

  await db.project.update({
    where: { id: projectId },
    data: {
      amountPaid: newAmountPaid,
      // If fully paid, mark completed
      ...(newAmountPaid >= project.totalAmount && project.totalAmount > 0
        ? { status: "COMPLETED" }
        : {}),
    },
  });

  await db.activityLog.create({
    data: {
      action: "MANUAL_PAYMENT_RECORDED",
      actor: admin.clerkId,
      projectId,
      metadata: { amount: amountCents },
    },
  });

  revalidatePath(`/projects/${project.slug}`);
}
