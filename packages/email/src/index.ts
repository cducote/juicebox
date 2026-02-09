import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM = "Juicebox Studios <noreply@juicebox-studios.com>";

type EmailTemplate =
  | "payment-received"
  | "payment-failed"
  | "grace-warning"
  | "project-suspended"
  | "project-handoff"
  | "payment-reminder";

interface EmailData {
  to: string;
  projectTitle: string;
  amount?: number; // cents
  daysRemaining?: number;
}

// Plain text templates for v1
const TEMPLATES: Record<EmailTemplate, (data: EmailData) => { subject: string; text: string }> = {
  "payment-received": (data) => ({
    subject: `Payment received for ${data.projectTitle}`,
    text: `Hi there,\n\nWe received your payment of $${((data.amount ?? 0) / 100).toFixed(2)} for "${data.projectTitle}".\n\nThank you!\n— Juicebox Studios`,
  }),
  "payment-failed": (data) => ({
    subject: `Payment failed for ${data.projectTitle}`,
    text: `Hi there,\n\nA payment for "${data.projectTitle}" failed. Please update your payment method to avoid service interruption.\n\n— Juicebox Studios`,
  }),
  "grace-warning": (data) => ({
    subject: `Action needed: ${data.projectTitle} grace period ending soon`,
    text: `Hi there,\n\nYour project "${data.projectTitle}" is in its grace period and has approximately ${data.daysRemaining} days remaining. Please make a payment to avoid suspension.\n\n— Juicebox Studios`,
  }),
  "project-suspended": (data) => ({
    subject: `Project suspended: ${data.projectTitle}`,
    text: `Hi there,\n\nYour project "${data.projectTitle}" has been suspended due to missed payments. Please contact us to resolve this.\n\n— Juicebox Studios`,
  }),
  "project-handoff": (data) => ({
    subject: `Congratulations! ${data.projectTitle} is ready for handoff`,
    text: `Hi there,\n\nGreat news! Your project "${data.projectTitle}" is complete and all services are being transferred to you.\n\nWe'll follow up with transfer details shortly.\n\n— Juicebox Studios`,
  }),
  "payment-reminder": (data) => ({
    subject: `Payment reminder: ${data.projectTitle}`,
    text: `Hi there,\n\nJust a friendly reminder that a payment of $${((data.amount ?? 0) / 100).toFixed(2)} for "${data.projectTitle}" is due soon.\n\n— Juicebox Studios`,
  }),
};

export async function sendEmail(template: EmailTemplate, data: EmailData) {
  const resend = getResend();
  const { subject, text } = TEMPLATES[template](data);

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject,
    text,
  });
}
