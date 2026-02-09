import { NextRequest, NextResponse } from "next/server";
import { db } from "@juicebox/db";
import { requireUser } from "@juicebox/auth/server";

/** GET /api/notifications — paginated notifications for current customer */
export async function GET(request: NextRequest) {
  const user = await requireUser();
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where: { userId: user.id } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return NextResponse.json({ notifications, total, unreadCount, page, limit });
}

/** PATCH /api/notifications — mark specific notifications as read */
export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  await db.notification.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

/** POST /api/notifications — actions like read-all */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "read-all") {
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
