import { z } from "zod";

export const createEpicSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  projectId: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const updateEpicSchema = createEpicSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  projectId: z.string().min(1),
  epicId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  isMilestone: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
});

export type CreateEpicInput = z.infer<typeof createEpicSchema>;
export type UpdateEpicInput = z.infer<typeof updateEpicSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
