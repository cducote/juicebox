"use client";

import { useTransition } from "react";
import { toggleHandoffItem, finalizeHandoff } from "@/app/actions/handoff";

type HandoffItem = {
  id: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
};

type Props = {
  items: HandoffItem[];
  projectId: string;
  isFinalized: boolean;
};

/**
 * Interactive handoff checklist — toggleable items + finalize button.
 * Disabled once the project is HANDED_OFF.
 */
export function HandoffChecklist({ items, projectId, isFinalized }: Props) {
  const [isPending, startTransition] = useTransition();

  const allComplete = items.length > 0 && items.every((i) => i.completed);

  function handleToggle(itemId: string) {
    if (isFinalized) return;
    startTransition(async () => {
      await toggleHandoffItem(itemId);
    });
  }

  function handleFinalize() {
    if (!allComplete || isFinalized) return;
    startTransition(async () => {
      await finalizeHandoff(projectId);
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggle(item.id)}
                disabled={isFinalized || isPending}
                className="mt-0.5 h-4 w-4 rounded border-border accent-juice-500"
              />
              <span
                className={`text-sm ${
                  item.completed
                    ? "text-text-secondary line-through"
                    : "text-text"
                }`}
              >
                {item.label}
              </span>
            </label>
            {item.completedAt && (
              <span className="ml-auto shrink-0 text-xs text-text-muted">
                {new Date(item.completedAt).toLocaleDateString()}
              </span>
            )}
          </li>
        ))}
      </ul>

      {!isFinalized && (
        <button
          onClick={handleFinalize}
          disabled={!allComplete || isPending}
          className="mt-4 rounded-lg bg-status-success px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Finalizing..." : "Finalize Handoff"}
        </button>
      )}

      {isFinalized && (
        <p className="mt-4 text-sm text-status-success">
          This project has been fully handed off to the client.
        </p>
      )}
    </div>
  );
}
