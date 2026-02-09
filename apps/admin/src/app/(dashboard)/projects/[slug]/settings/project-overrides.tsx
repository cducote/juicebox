"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { updateProjectStatus } from "@/app/actions/projects";
import {
  overrideGracePeriod,
  resetMissedPayments,
  recordManualPayment,
} from "@/app/actions/overrides";

const ALL_STATUSES = [
  "PLANNING",
  "AGREEMENT_PENDING",
  "PAYMENT_SETUP",
  "ACTIVE",
  "PAUSED",
  "SUSPENDED",
  "COMPLETED",
  "HANDED_OFF",
] as const;

type Props = {
  projectId: string;
  currentStatus: string;
  gracePeriodMonths: number;
  missedPayments: number;
  stripeSubscriptionId: string | null;
};

/**
 * Manual override controls — change status, reset missed payments,
 * extend grace period, record manual payments.
 */
export function ProjectOverrides({
  projectId,
  currentStatus,
  gracePeriodMonths,
  missedPayments,
  stripeSubscriptionId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [newGracePeriod, setNewGracePeriod] = useState(String(gracePeriodMonths));

  function handleStatusChange(status: string) {
    if (status === currentStatus) return;
    setConfirmStatus(status);
  }

  function confirmStatusChange() {
    if (!confirmStatus) return;
    startTransition(async () => {
      await updateProjectStatus(projectId, confirmStatus);
      setConfirmStatus(null);
      router.refresh();
    });
  }

  function handleResetMissed() {
    startTransition(async () => {
      await resetMissedPayments(projectId);
      router.refresh();
    });
  }

  function handleGracePeriodUpdate() {
    const months = parseInt(newGracePeriod, 10);
    if (isNaN(months) || months < 0) return;
    startTransition(async () => {
      await overrideGracePeriod(projectId, months);
      router.refresh();
    });
  }

  function handleManualPayment() {
    const cents = Math.round(parseFloat(paymentAmount) * 100);
    if (isNaN(cents) || cents <= 0) return;
    startTransition(async () => {
      await recordManualPayment(projectId, cents);
      setPaymentAmount("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Status Override */}
      <Card>
        <CardHeader>
          <CardTitle>Change Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={status === currentStatus || isPending}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === currentStatus
                    ? "border-juice-500 bg-juice-50 text-juice-700"
                    : "border-border hover:border-juice-300 hover:bg-surface-secondary"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {status.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {confirmStatus && (
            <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-3">
              <p className="mb-2 text-sm">
                Change status from{" "}
                <span className="font-semibold">{currentStatus}</span> to{" "}
                <span className="font-semibold">{confirmStatus}</span>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmStatusChange}
                  disabled={isPending}
                  className="rounded-md bg-juice-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-juice-600 disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmStatus(null)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grace Period */}
      <Card>
        <CardHeader>
          <CardTitle>Grace Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              value={newGracePeriod}
              onChange={(e) => setNewGracePeriod(e.target.value)}
              className="w-20 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            />
            <span className="text-sm text-text-secondary">months</span>
            <button
              onClick={handleGracePeriodUpdate}
              disabled={isPending || newGracePeriod === String(gracePeriodMonths)}
              className="rounded-md bg-juice-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-juice-600 disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Missed Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Missed Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Current missed payments: <span className="font-semibold">{missedPayments}</span>
          </p>
          {missedPayments > 0 && (
            <button
              onClick={handleResetMissed}
              disabled={isPending}
              className="rounded-md bg-status-warning px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Resetting..." : "Reset Missed Payments"}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Record Manual Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-muted">
            For equity deals or payments received outside Stripe.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-32 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleManualPayment}
              disabled={isPending || !paymentAmount}
              className="rounded-md bg-juice-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-juice-600 disabled:opacity-50"
            >
              {isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Subscription */}
      {stripeSubscriptionId && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-muted">
              Subscription ID: {stripeSubscriptionId}
            </p>
            {/* TODO: Add force-cancel subscription button */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
