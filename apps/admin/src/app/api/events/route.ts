import { requireAdmin } from "@juicebox/auth/server";
import { onEvent, type JuiceboxEvent } from "@juicebox/api/events";

/**
 * SSE endpoint — holds open connection per authenticated admin user.
 * Pushes real-time events (notifications, payments, status changes).
 */
export async function GET() {
  const admin = await requireAdmin();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial keepalive
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = onEvent((event: JuiceboxEvent) => {
        // Push events for this user or broadcast events (userId="*")
        if (event.userId === admin.id || event.userId === "*") {
          const payload = JSON.stringify({
            type: event.type,
            data: event.data,
          });
          try {
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          } catch {
            // Stream closed
          }
        }
      });

      // Keepalive every 30s to prevent proxy timeouts
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 30_000);

      // Store cleanup refs for cancel
      (controller as unknown as Record<string, unknown>).__cleanup = () => {
        unsubscribe();
        clearInterval(keepalive);
      };
    },

    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, unknown>).__cleanup as (() => void) | undefined;
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
