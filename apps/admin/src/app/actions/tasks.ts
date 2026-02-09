"use server";

import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";
import { createEpicSchema, createTaskSchema } from "@juicebox/api/validators/task";
import { revalidatePath } from "next/cache";

export async function createEpic(formData: FormData) {
  const admin = await requireAdmin();

  const data = createEpicSchema.parse({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    projectId: formData.get("projectId") as string,
  });

  const epic = await db.epic.create({ data });

  await db.activityLog.create({
    data: {
      action: "EPIC_CREATED",
      actor: admin.clerkId,
      projectId: data.projectId,
      metadata: { epicTitle: epic.title },
    },
  });

  revalidatePath(`/projects`);
}

export async function createTask(formData: FormData) {
  const admin = await requireAdmin();

  const data = createTaskSchema.parse({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    projectId: formData.get("projectId") as string,
    epicId: (formData.get("epicId") as string) || undefined,
    assigneeId: (formData.get("assigneeId") as string) || undefined,
    priority: (formData.get("priority") as string) || "MEDIUM",
    isMilestone: formData.get("isMilestone") === "true",
  });

  const task = await db.task.create({ data });

  await db.activityLog.create({
    data: {
      action: "TASK_CREATED",
      actor: admin.clerkId,
      projectId: data.projectId,
      metadata: { taskTitle: task.title, isMilestone: task.isMilestone },
    },
  });

  revalidatePath(`/projects`);
}

export async function updateTaskStatus(taskId: string, status: string) {
  const admin = await requireAdmin();

  const task = await db.task.update({
    where: { id: taskId },
    data: { status: status as "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" },
  });

  await db.activityLog.create({
    data: {
      action: "TASK_UPDATED",
      actor: admin.clerkId,
      projectId: task.projectId,
      metadata: { taskTitle: task.title, newStatus: status },
    },
  });

  revalidatePath(`/projects`);
}

export async function toggleMilestone(taskId: string) {
  await requireAdmin();

  const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });
  await db.task.update({
    where: { id: taskId },
    data: { isMilestone: !task.isMilestone },
  });

  revalidatePath(`/projects`);
}

export async function deleteTask(taskId: string) {
  await requireAdmin();
  const task = await db.task.delete({ where: { id: taskId } });
  revalidatePath(`/projects`);
  return task;
}

export async function deleteEpic(epicId: string) {
  await requireAdmin();
  await db.epic.delete({ where: { id: epicId } });
  revalidatePath(`/projects`);
}
