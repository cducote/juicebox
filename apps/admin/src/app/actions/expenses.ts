"use server";

import { db } from "@juicebox/db";
import { requireAdmin } from "@juicebox/auth/server";
import { createExpenseSchema } from "@juicebox/api/validators/expense";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const admin = await requireAdmin();

  const raw = {
    name: formData.get("name") as string,
    amount: Number(formData.get("amount")),
    description: (formData.get("description") as string) || undefined,
    category: (formData.get("category") as string) || undefined,
    receiptUrl: (formData.get("receiptUrl") as string) || undefined,
    projectId: (formData.get("projectId") as string) || undefined,
    date: formData.get("date") as string,
    isRecurring: formData.get("isRecurring") === "true",
    recurringInterval: (formData.get("recurringInterval") as string) || null,
  };

  const data = createExpenseSchema.parse(raw);

  await db.expense.create({
    data: {
      name: data.name,
      amount: data.amount,
      description: data.description,
      category: data.category,
      receiptUrl: data.receiptUrl,
      projectId: data.projectId || null,
      date: new Date(data.date),
      isRecurring: data.isRecurring,
      recurringInterval: data.recurringInterval,
      createdById: admin.id,
    },
  });

  revalidatePath("/expenses");
}

export async function deleteExpense(id: string) {
  await requireAdmin();
  await db.expense.delete({ where: { id } });
  revalidatePath("/expenses");
}

export async function getExpenses(filters?: {
  projectId?: string;
  category?: string;
  isRecurring?: boolean;
}) {
  await requireAdmin();

  return db.expense.findMany({
    where: {
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.isRecurring !== undefined ? { isRecurring: filters.isRecurring } : {}),
    },
    include: { project: { select: { title: true, slug: true } } },
    orderBy: { date: "desc" },
  });
}

export async function getExpenseSummary() {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // All recurring expenses for monthly burn calculation
  const recurringExpenses = await db.expense.findMany({
    where: { isRecurring: true },
  });

  // This month's expenses (all types)
  const monthExpenses = await db.expense.findMany({
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Monthly burn: sum monthly recurring + (yearly / 12)
  const monthlyBurn = recurringExpenses.reduce((sum, exp) => {
    if (exp.recurringInterval === "MONTHLY") return sum + exp.amount;
    if (exp.recurringInterval === "YEARLY") return sum + Math.round(exp.amount / 12);
    return sum;
  }, 0);

  // Total spend this month
  const totalThisMonth = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // One-time spend this month
  const oneTimeThisMonth = monthExpenses
    .filter((exp) => !exp.isRecurring)
    .reduce((sum, exp) => sum + exp.amount, 0);

  return { monthlyBurn, totalThisMonth, oneTimeThisMonth };
}
