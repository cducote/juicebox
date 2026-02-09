import { NextRequest, NextResponse } from "next/server";
import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";

/** GET /api/notifications — paginated notifications for current user */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: admin.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where: { userId: admin.id } }),
    db.notification.count({ where: { userId: admin.id, read: false } }),
  ]);

  return NextResponse.json({ notifications, total, unreadCount, page, limit });
}

/** PATCH /api/notifications — mark specific notifications as read */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  const body = await request.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  await db.notification.updateMany({
    where: { id: { in: ids }, userId: admin.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

/** POST /api/notifications/read-all — mark all as read */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "read-all") {
    await db.notification.updateMany({
      where: { userId: admin.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
