import { stripe } from "./client";
import { db } from "@juicebox/db";

/**
 * Create a Stripe customer + subscription for an installment project.
 * Sets cancel_at to term end date so the subscription auto-ends.
 */
export async function activateSubscription(projectId: string) {
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project.client) throw new Error("Project has no client assigned");
  if (project.totalAmount <= 0) throw new Error("Total amount must be set");
  if (project.termMonths <= 0) throw new Error("Term months must be set");

  // Create or retrieve Stripe customer
  let customerId = project.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: project.client.email,
      name: project.client.name ?? undefined,
      metadata: { projectId: project.id, userId: project.client.id },
    });
    customerId = customer.id;
  }

  // Create a recurring price for the monthly payment
  const price = await stripe.prices.create({
    unit_amount: project.monthlyPayment,
    currency: "usd",
    recurring: { interval: "month" },
    product_data: {
      name: `${project.title} — Monthly Payment`,
      metadata: { projectId: project.id },
    },
  });

  // Calculate when the subscription should auto-cancel
  const cancelAt = Math.floor(Date.now() / 1000) + project.termMonths * 30 * 24 * 60 * 60;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    cancel_at: cancelAt,
    metadata: { projectId: project.id },
  });

  // Update project with Stripe IDs and move to PAYMENT_SETUP
  await db.project.update({
    where: { id: projectId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: "PAYMENT_SETUP",
    },
  });

  return { subscriptionId: subscription.id, customerId };
}

/**
 * Create a one-time PaymentIntent for the remaining balance.
 * Client pays off everything at once, then subscription gets canceled.
 */
export async function createPayoffIntent(projectId: string) {
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  const remaining = project.totalAmount - project.amountPaid;
  if (remaining <= 0) throw new Error("Project is already fully paid");
  if (!project.stripeCustomerId) throw new Error("No Stripe customer for this project");

  const paymentIntent = await stripe.paymentIntents.create({
    amount: remaining,
    currency: "usd",
    customer: project.stripeCustomerId,
    metadata: { projectId: project.id, isPayoff: "true" },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    amount: remaining,
  };
}

/**
 * Cancel an active subscription (e.g. after payoff or manual override).
 */
export async function cancelSubscription(projectId: string) {
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  if (!project.stripeSubscriptionId) throw new Error("No subscription to cancel");

  await stripe.subscriptions.cancel(project.stripeSubscriptionId);

  await db.project.update({
    where: { id: projectId },
    data: { stripeSubscriptionId: null },
  });
}
