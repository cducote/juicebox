import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-juice-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-juice-600 text-white",
        secondary: "border-transparent bg-surface-tertiary text-text-primary",
        destructive: "border-transparent bg-red-600 text-white",
        outline: "text-text-primary",
        planning: "border-transparent bg-purple-100 text-purple-800",
        agreement: "border-transparent bg-amber-100 text-amber-800",
        "payment-setup": "border-transparent bg-blue-100 text-blue-800",
        active: "border-transparent bg-emerald-100 text-emerald-800",
        paused: "border-transparent bg-orange-100 text-orange-800",
        suspended: "border-transparent bg-red-100 text-red-800",
        completed: "border-transparent bg-cyan-100 text-cyan-800",
        "handed-off": "border-transparent bg-purple-100 text-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
