import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  clientId: z.string().optional(),
  dealType: z.enum(["INSTALLMENT", "EQUITY"]),
  totalAmount: z.number().int().min(0).optional(), // cents
  termMonths: z.number().int().min(1).max(120).optional(),
  gracePeriodMonths: z.number().int().min(0).max(24).default(3),
  targetCompletionDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z
    .enum([
      "PLANNING",
      "AGREEMENT_PENDING",
      "PAYMENT_SETUP",
      "ACTIVE",
      "PAUSED",
      "SUSPENDED",
      "COMPLETED",
      "HANDED_OFF",
    ])
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
