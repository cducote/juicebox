import { EventEmitter } from "events";

/**
 * In-process event bus for real-time SSE push.
 * Webhook handlers and server actions emit events here,
 * SSE connections subscribe per-user and push to the client.
 */

export type JuiceboxEvent = {
  type:
    | "notification"
    | "payment_received"
    | "status_changed"
    | "activity"
    | "handoff_update";
  userId: string;
  data: Record<string, unknown>;
};

const EVENT_NAME = "jb:event";

const globalForEvents = globalThis as unknown as {
  eventBus: EventEmitter | undefined;
};

export const eventBus: EventEmitter =
  globalForEvents.eventBus ?? new EventEmitter();

// Prevent memory leak warnings for many SSE connections
eventBus.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventBus = eventBus;
}

/** Emit an event on the bus */
export function emitEvent(event: JuiceboxEvent) {
  eventBus.emit(EVENT_NAME, event);
}

/** Subscribe to events */
export function onEvent(listener: (event: JuiceboxEvent) => void): () => void {
  eventBus.on(EVENT_NAME, listener);
  return () => eventBus.off(EVENT_NAME, listener);
}

/** Convenience: emit a notification event for a specific user */
export function emitNotification(userId: string, data: Record<string, unknown>) {
  emitEvent({ type: "notification", userId, data });
}

/** Convenience: emit a payment received event */
export function emitPaymentReceived(userId: string, data: Record<string, unknown>) {
  emitEvent({ type: "payment_received", userId, data });
}

/** Convenience: emit a status change event */
export function emitStatusChanged(userId: string, data: Record<string, unknown>) {
  emitEvent({ type: "status_changed", userId, data });
}
