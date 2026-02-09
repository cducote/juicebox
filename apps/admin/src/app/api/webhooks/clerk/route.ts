import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@juicebox/db";
import type { UserRole } from "@juicebox/db";
import { NextResponse } from "next/server";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    public_metadata: { role?: string };
  };
}

/**
 * Clerk webhook handler — syncs users to our database.
 * Fires on user.created and user.updated events.
 * Svix verifies the webhook signature to prevent spoofing.
 */
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses[0]?.email_address;
    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;
    const role = (data.public_metadata?.role as UserRole) || "CUSTOMER";

    await db.user.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        email,
        name,
        role,
        imageUrl: data.image_url,
      },
      update: {
        email,
        name,
        role,
        imageUrl: data.image_url,
      },
    });
  }

  return NextResponse.json({ received: true });
}
