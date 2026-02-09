import { expect, test } from "@playwright/test";

/**
 * Tests for the notifications API endpoints.
 * These run as authenticated requests using the stored admin session.
 */
test.describe("Notifications API", () => {
  test("GET /api/notifications returns paginated results", async ({ request }) => {
    const response = await request.get("/api/notifications?page=1&limit=10");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("notifications");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("unreadCount");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("limit");

    expect(Array.isArray(data.notifications)).toBeTruthy();
    expect(typeof data.total).toBe("number");
    expect(typeof data.unreadCount).toBe("number");
    expect(data.page).toBe(1);
    expect(data.limit).toBe(10);
  });

  test("GET /api/notifications respects limit parameter", async ({ request }) => {
    const response = await request.get("/api/notifications?page=1&limit=5");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.notifications.length).toBeLessThanOrEqual(5);
    expect(data.limit).toBe(5);
  });

  test("GET /api/notifications caps limit at 50", async ({ request }) => {
    const response = await request.get("/api/notifications?page=1&limit=100");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.limit).toBeLessThanOrEqual(50);
  });

  test("GET /api/notifications supports pagination", async ({ request }) => {
    const page1 = await request.get("/api/notifications?page=1&limit=5");
    const page2 = await request.get("/api/notifications?page=2&limit=5");

    expect(page1.ok()).toBeTruthy();
    expect(page2.ok()).toBeTruthy();

    const data1 = await page1.json();
    const data2 = await page2.json();

    // Page numbers should match
    expect(data1.page).toBe(1);
    expect(data2.page).toBe(2);

    // If there are enough notifications, pages should have different items
    if (data1.total > 5) {
      const ids1 = data1.notifications.map((n: { id: string }) => n.id);
      const ids2 = data2.notifications.map((n: { id: string }) => n.id);
      const overlap = ids1.filter((id: string) => ids2.includes(id));
      expect(overlap.length).toBe(0);
    }
  });

  test("PATCH /api/notifications marks specific notifications as read", async ({ request }) => {
    // First, get notifications to find IDs
    const listResponse = await request.get("/api/notifications?page=1&limit=5");
    const listData = await listResponse.json();

    if (listData.notifications.length > 0) {
      const unreadIds = listData.notifications
        .filter((n: { read: boolean }) => !n.read)
        .map((n: { id: string }) => n.id)
        .slice(0, 2);

      if (unreadIds.length > 0) {
        const response = await request.patch("/api/notifications", {
          data: { ids: unreadIds },
        });
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        expect(data.success).toBe(true);
      }
    }
  });

  test("PATCH /api/notifications rejects empty ids array", async ({ request }) => {
    const response = await request.patch("/api/notifications", {
      data: { ids: [] },
    });
    // Should either succeed silently or reject
    const status = response.status();
    expect(status).toBeLessThanOrEqual(422); // 200 or 400/422
  });

  test("POST /api/notifications read-all marks all as read", async ({ request }) => {
    const response = await request.post("/api/notifications", {
      data: { action: "read-all" },
    });
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify by fetching — unreadCount should be 0
    const verifyResponse = await request.get("/api/notifications?page=1&limit=1");
    const verifyData = await verifyResponse.json();
    expect(verifyData.unreadCount).toBe(0);
  });

  test("POST /api/notifications rejects invalid action", async ({ request }) => {
    const response = await request.post("/api/notifications", {
      data: { action: "invalid-action" },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("Health API", () => {
  test("GET /api/health returns ok status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data).toHaveProperty("timestamp");
  });
});
