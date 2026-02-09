import { cn } from "@juicebox/ui/lib/utils";

interface PaymentProgressProps {
  amountPaid: number; // cents
  totalAmount: number; // cents
  className?: string;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function PaymentProgress({ amountPaid, totalAmount, className }: PaymentProgressProps) {
  if (totalAmount === 0) return null;

  const percentage = Math.min(Math.round((amountPaid / totalAmount) * 100), 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{formatCents(amountPaid)} paid</span>
        <span>{formatCents(totalAmount)} total</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-tertiary">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-right text-xs font-medium text-text-secondary">{percentage}%</div>
    </div>
  );
}

export { formatCents };
