import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { StatusBadge } from "./status-badge";
import { PaymentProgress } from "./payment-progress";
import type { ProjectStatus, User } from "@juicebox/db";

interface ProjectCardProps {
  slug: string;
  title: string;
  status: ProjectStatus;
  client: Pick<User, "name" | "email"> | null;
  amountPaid: number;
  totalAmount: number;
  taskCount: number;
}

export function ProjectCard({
  slug,
  title,
  status,
  client,
  amountPaid,
  totalAmount,
  taskCount,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${slug}`}>
      <Card className="transition-shadow hover:shadow-card-hover">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <StatusBadge status={status} />
        </CardHeader>
        <CardContent className="space-y-3">
          {client && (
            <p className="text-sm text-text-secondary">{client.name || client.email}</p>
          )}
          {totalAmount > 0 && (
            <PaymentProgress amountPaid={amountPaid} totalAmount={totalAmount} />
          )}
          <p className="text-xs text-text-muted">{taskCount} tasks</p>
        </CardContent>
      </Card>
    </Link>
  );
}
