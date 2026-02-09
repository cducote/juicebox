import { expect, test } from "@playwright/test";

/**
 * Tests for Stripe webhook endpoint.
 * These use mock payloads to verify the webhook handler processes events correctly
 * without needing a live Stripe connection.
 */
test.describe("Stripe Webhook API", () => {
  const webhookUrl = "/api/webhooks/stripe";

  test("rejects requests without stripe-signature header", async ({ request }) => {
    const response = await request.post(webhookUrl, {
      data: JSON.stringify({ type: "invoice.paid" }),
      headers: { "Content-Type": "application/json" },
    });
    // Should fail signature verification — 400 or 401
    expect([400, 401]).toContain(response.status());
  });

  test("rejects requests with invalid signature", async ({ request }) => {
    const payload = JSON.stringify({
      id: "evt_test_invalid",
      type: "invoice.paid",
      data: { object: {} },
    });

    const response = await request.post(webhookUrl, {
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=123456,v1=invalid_signature",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("rejects malformed JSON body", async ({ request }) => {
    const response = await request.post(webhookUrl, {
      data: "not-json{{{",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=123456,v1=abc",
      },
    });
    expect([400, 401, 500]).toContain(response.status());
  });

  test("handles missing body gracefully", async ({ request }) => {
    const response = await request.post(webhookUrl, {
      headers: {
        "stripe-signature": "t=123456,v1=test",
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("correct content type required", async ({ request }) => {
    const response = await request.post(webhookUrl, {
      data: "test",
      headers: {
        "Content-Type": "text/plain",
        "stripe-signature": "t=123,v1=test",
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("Clerk Webhook API", () => {
  const webhookUrl = "/api/webhooks/clerk";

  test("rejects requests without svix headers", async ({ request }) => {
    const response = await request.post(webhookUrl, {
      data: JSON.stringify({ type: "user.created", data: {} }),
      headers: { "Content-Type": "application/json" },
    });
    // Should fail Svix signature verification
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("rejects requests with invalid svix signature", async ({ request }) => {
    const response = await request.post(webhookUrl, {
      data: JSON.stringify({ type: "user.created", data: {} }),
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_test",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,invalid_signature_here",
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
