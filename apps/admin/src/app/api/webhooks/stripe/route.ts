import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@juicebox/stripe/client";
import { handleStripeWebhook } from "@juicebox/stripe/webhooks";

/**
 * Stripe webhook handler — verifies signature, delegates to shared handler.
 * NO auth middleware on this route (webhooks come from Stripe, not users).
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  try {
    await handleStripeWebhook(event);
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 200 anyway to prevent Stripe from retrying — log the error
    return NextResponse.json({ received: true, error: "Handler error" });
  }

  return NextResponse.json({ received: true });
}
