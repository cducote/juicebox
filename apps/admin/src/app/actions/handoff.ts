"use server";

import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";
import { DEFAULT_HANDOFF_ITEMS } from "@juicebox/api/handoff";
import { sendEmail } from "@juicebox/email";
import { emitNotification, emitStatusChanged } from "@juicebox/api/events";
import { revalidatePath } from "next/cache";

export async function generateHandoffChecklist(projectId: string) {
  const admin = await requireAdmin();

  // Check if checklist already exists
  const existing = await db.handoffItem.findFirst({ where: { projectId } });
  if (existing) throw new Error("Handoff checklist already exists");

  const items = DEFAULT_HANDOFF_ITEMS.map((label, idx) => ({
    label,
    sortOrder: idx,
    projectId,
  }));

  await db.handoffItem.createMany({ data: items });

  await db.activityLog.create({
    data: {
      action: "HANDOFF_STARTED",
      actor: admin.clerkId,
      projectId,
      metadata: { itemCount: items.length },
    },
  });

  revalidatePath(`/projects`);
}

export async function toggleHandoffItem(itemId: string) {
  await requireAdmin();

  const item = await db.handoffItem.findUniqueOrThrow({ where: { id: itemId } });

  await db.handoffItem.update({
    where: { id: itemId },
    data: {
      completed: !item.completed,
      completedAt: !item.completed ? new Date() : null,
    },
  });

  revalidatePath(`/projects`);
}

export async function finalizeHandoff(projectId: string) {
  const admin = await requireAdmin();

  // Verify all items are completed
  const items = await db.handoffItem.findMany({ where: { projectId } });
  const allComplete = items.length > 0 && items.every((item) => item.completed);

  if (!allComplete) {
    throw new Error("All handoff items must be completed before finalizing");
  }

  const project = await db.project.update({
    where: { id: projectId },
    data: { status: "HANDED_OFF" },
    include: { client: true },
  });

  await db.activityLog.create({
    data: {
      action: "HANDOFF_COMPLETED",
      actor: admin.clerkId,
      projectId,
    },
  });

  // Notify + email the client
  if (project.client) {
    await db.notification.create({
      data: {
        type: "HANDOFF_READY",
        title: "Project Handed Off",
        message: `Your project "${project.title}" has been fully handed off to you!`,
        userId: project.client.id,
        projectId,
      },
    });

    await sendEmail("project-handoff", {
      to: project.client.email,
      projectTitle: project.title,
    });

    emitNotification(project.client.id, { projectId });
    emitStatusChanged(project.client.id, { projectId, status: "HANDED_OFF" });
  }

  revalidatePath(`/projects`);
}
