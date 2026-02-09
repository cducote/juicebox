// Project status display config — maps enums to human-friendly labels + colors
export const PROJECT_STATUS_CONFIG = {
  PLANNING: { label: "Planning", color: "status-planning" },
  AGREEMENT_PENDING: { label: "Agreement Pending", color: "status-agreement" },
  PAYMENT_SETUP: { label: "Payment Setup", color: "status-payment-setup" },
  ACTIVE: { label: "Active", color: "status-active" },
  PAUSED: { label: "Paused", color: "status-paused" },
  SUSPENDED: { label: "Suspended", color: "status-suspended" },
  COMPLETED: { label: "Completed", color: "status-completed" },
  HANDED_OFF: { label: "Handed Off", color: "status-handed-off" },
} as const;

export const DEAL_TYPE_LABELS = {
  INSTALLMENT: "Installment Plan",
  EQUITY: "Equity Deal",
} as const;

export const TASK_PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

// Default expense categories for the category selector
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Software",
  "Domain",
  "Hosting",
  "Marketing",
  "Hardware",
  "Design",
  "Legal",
  "Other",
] as const;
