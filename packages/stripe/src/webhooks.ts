import type Stripe from "stripe";
import { db } from "@juicebox/db";
import { emitNotification, emitPaymentReceived, emitStatusChanged } from "@juicebox/api/events";

/**
 * Process Stripe webhook events that drive automated status transitions.
 * This is the revenue engine — handles all payment lifecycle events.
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
  }
}

/**
 * invoice.paid — Record payment, update amountPaid, activate project if first payment.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const projectId = invoice.subscription_details?.metadata?.projectId
    ?? (typeof invoice.subscription === "string" ? await getProjectIdFromSubscription(invoice.subscription) : null);
  if (!projectId) return;

  const amount = invoice.amount_paid;

  // Record the payment
  await db.payment.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      amount,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
      status: "PAID",
      paidAt: new Date(),
      projectId,
    },
    update: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // Update project amountPaid and potentially activate
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  const newAmountPaid = project.amountPaid + amount;

  await db.project.update({
    where: { id: projectId },
    data: {
      amountPaid: newAmountPaid,
      // First payment activates the project
      ...(project.status === "PAYMENT_SETUP" ? { status: "ACTIVE" } : {}),
    },
  });

  // Log + notify
  await db.activityLog.create({
    data: {
      action: "PAYMENT_RECEIVED",
      actor: "system",
      projectId,
      metadata: { amount, invoiceId: invoice.id },
    },
  });

  if (project.clientId) {
    await db.notification.create({
      data: {
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: `Payment of $${(amount / 100).toFixed(2)} received for "${project.title}"`,
        userId: project.clientId,
        projectId,
      },
    });
    emitNotification(project.clientId, { projectId });
    emitPaymentReceived(project.clientId, { amount, projectId });
  }

  // Notify all admins of payment
  emitPaymentReceived("*", { amount, projectId, projectTitle: project.title });
}

/**
 * invoice.payment_failed — Increment missedPayments, notify admin.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
  if (!subscriptionId) return;

  const project = await db.project.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!project) return;

  await db.project.update({
    where: { id: project.id },
    data: { missedPayments: { increment: 1 } },
  });

  await db.activityLog.create({
    data: {
      action: "PAYMENT_FAILED",
      actor: "system",
      projectId: project.id,
      metadata: { invoiceId: invoice.id },
    },
  });

  // Notify client
  if (project.clientId) {
    await db.notification.create({
      data: {
        type: "PAYMENT_MISSED",
        title: "Payment Failed",
        message: `A payment for "${project.title}" failed. Please update your payment method.`,
        userId: project.clientId,
        projectId: project.id,
      },
    });
    emitNotification(project.clientId, { projectId: project.id });
  }

  // Alert all admins
  emitNotification("*", { projectId: project.id, type: "payment_failed" });
}

/**
 * customer.subscription.deleted — Check if fully paid → COMPLETED.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const project = await db.project.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!project) return;

  // Clear subscription reference
  const updateData: Record<string, unknown> = {
    stripeSubscriptionId: null,
  };

  // If fully paid, mark as COMPLETED
  if (project.amountPaid >= project.totalAmount) {
    updateData.status = "COMPLETED";
  }

  await db.project.update({
    where: { id: project.id },
    data: updateData,
  });

  if (project.amountPaid >= project.totalAmount) {
    await db.activityLog.create({
      data: {
        action: "STATUS_CHANGED",
        actor: "system",
        projectId: project.id,
        metadata: { newStatus: "COMPLETED", reason: "fully_paid" },
      },
    });

    if (project.clientId) {
      emitStatusChanged(project.clientId, { projectId: project.id, status: "COMPLETED" });
    }
    emitStatusChanged("*", { projectId: project.id, status: "COMPLETED" });
  }
}

/**
 * payment_intent.succeeded — Handle payoff payments (one-time full balance).
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const projectId = paymentIntent.metadata?.projectId;
  const isPayoff = paymentIntent.metadata?.isPayoff === "true";
  if (!projectId || !isPayoff) return;

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  // Record the payoff payment
  await db.payment.create({
    data: {
      amount: paymentIntent.amount,
      stripePaymentIntentId: paymentIntent.id,
      status: "PAID",
      paidAt: new Date(),
      isPayoff: true,
      projectId,
    },
  });

  // Update project as fully paid + COMPLETED
  await db.project.update({
    where: { id: projectId },
    data: {
      amountPaid: project.totalAmount,
      status: "COMPLETED",
    },
  });

  // Cancel the subscription if it exists
  if (project.stripeSubscriptionId) {
    // Import dynamically to avoid circular dependency
    const { cancelSubscription } = await import("./subscriptions");
    await cancelSubscription(projectId);
  }

  await db.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      actor: "system",
      projectId,
      metadata: { newStatus: "COMPLETED", reason: "payoff" },
    },
  });

  if (project.clientId) {
    emitStatusChanged(project.clientId, { projectId, status: "COMPLETED" });
  }
  emitStatusChanged("*", { projectId, status: "COMPLETED" });
}

/**
 * Helper: look up projectId from a subscription ID.
 */
async function getProjectIdFromSubscription(subscriptionId: string): Promise<string | null> {
  const project = await db.project.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true },
  });
  return project?.id ?? null;
}
