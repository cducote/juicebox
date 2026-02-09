import type { ProjectStatus } from "@juicebox/db";

// Friendly, customer-facing status messages
const STATUS_COPY: Record<ProjectStatus, { headline: string; description: string }> = {
  PLANNING: {
    headline: "Getting things set up",
    description: "We're mapping out your project and putting together the plan.",
  },
  AGREEMENT_PENDING: {
    headline: "Agreement ready for review",
    description: "Your project agreement is ready. Review and sign to get started.",
  },
  PAYMENT_SETUP: {
    headline: "Setting up payments",
    description: "Almost there! We're getting your payment plan ready.",
  },
  ACTIVE: {
    headline: "We're building your thing!",
    description: "Your project is actively being developed. Check milestones below for progress.",
  },
  PAUSED: {
    headline: "Project paused",
    description: "Your project is on hold. Please contact us to resume.",
  },
  SUSPENDED: {
    headline: "Project suspended",
    description: "Your project has been suspended due to missed payments. Contact us to resolve.",
  },
  COMPLETED: {
    headline: "Project complete!",
    description: "Your project is done! We're preparing to hand everything over to you.",
  },
  HANDED_OFF: {
    headline: "It's all yours!",
    description: "All services and accounts have been transferred to you. Enjoy!",
  },
};

export function ProjectStatusDisplay({ status }: { status: ProjectStatus }) {
  const copy = STATUS_COPY[status];

  return (
    <div className="rounded-lg bg-surface p-6 text-center">
      <h2 className="text-xl font-semibold">{copy.headline}</h2>
      <p className="mt-1 text-text-secondary">{copy.description}</p>
    </div>
  );
}
