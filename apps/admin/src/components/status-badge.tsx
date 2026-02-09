import { Badge } from "@juicebox/ui/components/badge";
import { PROJECT_STATUS_CONFIG } from "@juicebox/api/constants";
import type { ProjectStatus } from "@juicebox/db";

const variantMap: Record<ProjectStatus, Parameters<typeof Badge>[0]["variant"]> = {
  PLANNING: "planning",
  AGREEMENT_PENDING: "agreement",
  PAYMENT_SETUP: "payment-setup",
  ACTIVE: "active",
  PAUSED: "paused",
  SUSPENDED: "suspended",
  COMPLETED: "completed",
  HANDED_OFF: "handed-off",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = PROJECT_STATUS_CONFIG[status];
  return <Badge variant={variantMap[status]}>{config.label}</Badge>;
}
