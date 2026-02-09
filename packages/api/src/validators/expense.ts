import { z } from "zod";

export const createExpenseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  amount: z.number().int().min(1, "Amount must be at least 1 cent"),
  description: z.string().optional(),
  category: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  projectId: z.string().optional(),
  date: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["MONTHLY", "YEARLY"]).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
