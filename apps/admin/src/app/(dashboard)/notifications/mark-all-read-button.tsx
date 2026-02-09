"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md px-3 py-1.5 text-sm text-juice-600 hover:bg-surface-secondary disabled:opacity-50"
    >
      {isPending ? "Marking..." : "Mark all as read"}
    </button>
  );
}
