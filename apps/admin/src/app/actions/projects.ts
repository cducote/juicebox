"use server";

import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";
import { createProjectSchema, updateProjectSchema } from "@juicebox/api/validators/project";
import { revalidatePath } from "next/cache";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (await db.project.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

export async function createProject(formData: FormData) {
  const admin = await requireAdmin();

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    clientId: (formData.get("clientId") as string) || undefined,
    dealType: formData.get("dealType") as string,
    totalAmount: formData.get("totalAmount") ? Number(formData.get("totalAmount")) : undefined,
    termMonths: formData.get("termMonths") ? Number(formData.get("termMonths")) : undefined,
    gracePeriodMonths: formData.get("gracePeriodMonths")
      ? Number(formData.get("gracePeriodMonths"))
      : 3,
    notes: (formData.get("notes") as string) || undefined,
  };

  const data = createProjectSchema.parse(raw);
  const slug = await generateUniqueSlug(data.title);

  // Calculate monthly payment if installment deal with total + term
  const monthlyPayment =
    data.dealType === "INSTALLMENT" && data.totalAmount && data.termMonths
      ? Math.ceil(data.totalAmount / data.termMonths)
      : 0;

  const project = await db.project.create({
    data: {
      title: data.title,
      description: data.description,
      slug,
      dealType: data.dealType,
      clientId: data.clientId || null,
      totalAmount: data.totalAmount ?? 0,
      termMonths: data.termMonths ?? 0,
      monthlyPayment,
      gracePeriodMonths: data.gracePeriodMonths,
      notes: data.notes,
    },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      action: "PROJECT_CREATED",
      actor: admin.clerkId,
      projectId: project.id,
      metadata: { title: project.title },
    },
  });

  revalidatePath("/projects");
  return { slug: project.slug };
}

export async function updateProject(id: string, formData: FormData) {
  const admin = await requireAdmin();

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value !== "") {
      if (key === "totalAmount" || key === "termMonths" || key === "gracePeriodMonths") {
        raw[key] = Number(value);
      } else {
        raw[key] = value;
      }
    }
  }

  const data = updateProjectSchema.parse(raw);

  const project = await db.project.update({
    where: { id },
    data: {
      ...data,
      targetCompletionDate: data.targetCompletionDate
        ? new Date(data.targetCompletionDate)
        : undefined,
    },
  });

  await db.activityLog.create({
    data: {
      action: "PROJECT_UPDATED",
      actor: admin.clerkId,
      projectId: project.id,
      metadata: { changes: Object.keys(data) },
    },
  });

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");
}

export async function updateProjectStatus(
  id: string,
  status: string,
) {
  const admin = await requireAdmin();

  const project = await db.project.update({
    where: { id },
    data: {
      status: status as Parameters<typeof db.project.update>[0]["data"]["status"],
      // If pausing, record when grace period started
      ...(status === "PAUSED" ? { gracePeriodStartedAt: new Date() } : {}),
      // If un-pausing, clear grace period
      ...(status === "ACTIVE" ? { gracePeriodStartedAt: null, missedPayments: 0 } : {}),
    },
  });

  await db.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      actor: admin.clerkId,
      projectId: project.id,
      metadata: { newStatus: status },
    },
  });

  // Create notification for client if they exist
  if (project.clientId) {
    await db.notification.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Project Status Updated",
        message: `Your project "${project.title}" status changed to ${status}`,
        userId: project.clientId,
        projectId: project.id,
      },
    });
  }

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");
}

export async function getProjects(filters?: { status?: string; search?: string }) {
  await requireAdmin();

  return db.project.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as Parameters<typeof db.project.findMany>[0] extends { where?: infer W } ? W extends { status?: infer S } ? S : never : never } : {}),
      ...(filters?.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" as const } },
              { description: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      client: true,
      _count: { select: { tasks: true, payments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProject(slug: string) {
  return db.project.findUnique({
    where: { slug },
    include: {
      client: true,
      epics: {
        include: { tasks: { include: { assignee: true }, orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      tasks: { include: { assignee: true }, orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      expenses: { orderBy: { date: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      handoffItems: { orderBy: { sortOrder: "asc" } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      notifications: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}
